import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import gpaRoutes from './routes/gpa.js';
import semesterRoutes from './routes/semesters.js';
import analysisRoutes from './routes/analysis.js';

const app = express();
app.set('trust proxy', 1); // cần khi chạy sau proxy của Render/Railway/Vercel...

const envOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...envOrigins,
];

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Cho phép request không có origin (Postman, curl, server-to-server)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '100kb' }));
app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/gpa', gpaRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/analysis', analysisRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint không tồn tại.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Dữ liệu gửi lên không phải JSON hợp lệ.' });
  }
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Lỗi máy chủ. Thử lại sau.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;