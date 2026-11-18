import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';
import { HttpError } from '../httpError.js';
import { optionalAuth, requireAuth } from '../auth.js';
import { calculateGpa, validateCourses } from '../services/gpa.js';
import { loadSemesters } from '../services/semesters.js';
import { analyzeWithGemini } from '../services/gemini.js';

const router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn đã phân tích quá nhiều lần. Thử lại sau 15 phút.' },
});

// Phân tích GPA bằng Gemini.
// - Gửi kèm body.semesters: phân tích dữ liệu vừa nhập (không cần đăng nhập)
// - Không gửi body và đã đăng nhập: phân tích toàn bộ học kỳ đã lưu
router.post('/', optionalAuth, limiter, async (req, res) => {
  let semesters = req.body?.semesters;

  if (semesters === undefined) {
    if (!req.user) throw new HttpError(400, 'Hãy nhập điểm hoặc đăng nhập để phân tích dữ liệu đã lưu.');
    semesters = await loadSemesters(req.user.id);
    if (semesters.length === 0) throw new HttpError(400, 'Bạn chưa lưu học kỳ nào để phân tích.');
  } else if (!Array.isArray(semesters) || semesters.length === 0 || semesters.length > 20) {
    throw new HttpError(400, 'Cần từ 1 đến 20 học kỳ.');
  }

  const summaries = semesters.map((s, i) => {
    const name = String(s?.name ?? '').trim().slice(0, 100) || `Học kỳ ${i + 1}`;
    const { courses, gpa4, gpa10, totalCredits, classification } = calculateGpa(
      validateCourses(s?.courses),
    );
    return { name, gpa4, gpa10, totalCredits, classification, courses };
  });

  const all = calculateGpa(summaries.flatMap((s) => s.courses.map(({ name, credits, score }) => ({ name, credits, score }))));
  const cumulative = {
    gpa4: all.gpa4,
    gpa10: all.gpa10,
    totalCredits: all.totalCredits,
    classification: all.classification,
  };

  const analysis = await analyzeWithGemini({ cumulative, semesters: summaries });

  // if (req.user) {
  //   await pool.execute('INSERT INTO analyses (user_id, gpa4, result) VALUES (?, ?, ?)', [
  //     req.user.id,
  //     cumulative.gpa4,
  //     JSON.stringify(analysis),
  //   ]);
  // }

  res.json({
    cumulative,
    semesters: summaries.map(({ name, gpa4, gpa10, totalCredits }) => ({ name, gpa4, gpa10, totalCredits })),
    analysis,
  });
});

// 10 lần phân tích gần nhất của tài khoản
router.get('/history', requireAuth, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, gpa4, result, created_at FROM analyses WHERE user_id = ? ORDER BY id DESC LIMIT 10',
    [req.user.id],
  );
  res.json({
    analyses: rows.map((r) => ({
      id: r.id,
      gpa4: Number(r.gpa4),
      createdAt: r.created_at,
      analysis: typeof r.result === 'string' ? JSON.parse(r.result) : r.result,
    })),
  });
});

export default router;
