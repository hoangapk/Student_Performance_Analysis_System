import { Router } from 'express';
import { calculateGpa, validateCourses, requiredFinal, expectedGpa } from '../services/gpa.js';

const router = Router();

// Tính GPA từ danh sách môn học (không cần đăng nhập)
router.post('/calculate', (req, res) => {
  const courses = validateCourses(req.body?.courses);
  res.json(calculateGpa(courses));
});

// Cuối kỳ cần bao nhiêu điểm để đạt điểm tổng kết mong muốn
router.post('/required-final', (req, res) => {
  res.json(requiredFinal(req.body ?? {}));
});

// GPA kỳ vọng ở các tín chỉ còn lại
router.post('/expected', (req, res) => {
  res.json(expectedGpa(req.body ?? {}));
});

export default router;
