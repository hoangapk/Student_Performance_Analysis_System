import { Router } from 'express';
import { pool } from '../db.js';
import { HttpError } from '../httpError.js';
import { requireAuth } from '../auth.js';
import { calculateGpa, validateCourses } from '../services/gpa.js';
import { loadSemesters } from '../services/semesters.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const semesters = await loadSemesters(req.user.id);
  res.json({
    semesters: semesters.map((s) => {
      const { gpa4, gpa10, totalCredits, classification } = calculateGpa(s.courses);
      return { ...s, gpa4, gpa10, totalCredits, classification };
    }),
  });
});

router.post('/', async (req, res) => {
  const name = String(req.body?.name ?? '').trim().slice(0, 100);
  if (!name) throw new HttpError(400, 'Vui lòng đặt tên học kỳ.');
  const courses = validateCourses(req.body?.courses);

  const [[{ total }]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM semesters WHERE user_id = ?',
    [req.user.id],
  );
  if (total >= 30) throw new HttpError(400, 'Mỗi tài khoản lưu tối đa 30 học kỳ.');

  const result = calculateGpa(courses);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [ins] = await conn.execute('INSERT INTO semesters (user_id, name) VALUES (?, ?)', [
      req.user.id,
      name,
    ]);
    await conn.query(
      'INSERT INTO courses (semester_id, name, credits, score10, letter, gpa4) VALUES ?',
      [result.courses.map((c) => [ins.insertId, c.name, c.credits, c.score, c.letter, c.point])],
    );
    await conn.commit();
    res.status(201).json({ id: ins.insertId, name, gpa4: result.gpa4, gpa10: result.gpa10 });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

router.delete('/:id', async (req, res) => {
  const [result] = await pool.execute('DELETE FROM semesters WHERE id = ? AND user_id = ?', [
    Number(req.params.id),
    req.user.id,
  ]);
  if (result.affectedRows === 0) throw new HttpError(404, 'Không tìm thấy học kỳ.');
  res.status(204).end();
});

export default router;
