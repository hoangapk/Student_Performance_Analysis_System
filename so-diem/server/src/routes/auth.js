import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { HttpError } from '../httpError.js';
import { signToken, requireAuth } from '../auth.js';

const router = Router();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name });

router.post('/register', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const name = String(req.body?.name ?? '').trim().slice(0, 100);
  const password = String(req.body?.password ?? '');
  if (!EMAIL.test(email) || email.length > 190) throw new HttpError(400, 'Email không hợp lệ.');
  if (!name) throw new HttpError(400, 'Vui lòng nhập tên hiển thị.');
  if (password.length < 8 || password.length > 72) {
    throw new HttpError(400, 'Mật khẩu cần từ 8 đến 72 ký tự.');
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)',
      [email, name, hash],
    );
    const user = { id: result.insertId, email, name };
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Email này đã được đăng ký.');
    throw err;
  }
});

router.post('/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) throw new HttpError(401, 'Email hoặc mật khẩu không đúng.');
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.execute('SELECT id, email, name FROM users WHERE id = ?', [req.user.id]);
  if (!rows[0]) throw new HttpError(401, 'Phiên đăng nhập không còn hợp lệ.');
  res.json({ user: rows[0] });
});

export default router;
