import jwt from 'jsonwebtoken';
import { HttpError } from './httpError.js';

const secret = () => {
  if (!process.env.JWT_SECRET) throw new HttpError(500, 'Máy chủ chưa cấu hình JWT_SECRET.');
  return process.env.JWT_SECRET;
};

export const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, secret(), { expiresIn: '7d' });

function readUser(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.slice(7), secret());
  } catch {
    return null;
  }
}

export function requireAuth(req, _res, next) {
  const user = readUser(req);
  if (!user) throw new HttpError(401, 'Bạn cần đăng nhập để dùng chức năng này.');
  req.user = user;
  next();
}

export function optionalAuth(req, _res, next) {
  req.user = readUser(req);
  next();
}
