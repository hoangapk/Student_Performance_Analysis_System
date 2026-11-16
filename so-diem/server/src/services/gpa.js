import { HttpError } from '../httpError.js';

// Thang điểm quy đổi 10 -> chữ -> 4 (phổ biến theo quy chế tín chỉ).
// Mỗi trường có thể khác nhau: sửa bảng này hoặc tách thành nhiều bảng theo trường.
export const SCALE = [
  { min: 8.5, letter: 'A', point: 4.0 },
  { min: 8.0, letter: 'B+', point: 3.5 },
  { min: 7.0, letter: 'B', point: 3.0 },
  { min: 6.5, letter: 'C+', point: 2.5 },
  { min: 5.5, letter: 'C', point: 2.0 },
  { min: 5.0, letter: 'D+', point: 1.5 },
  { min: 4.0, letter: 'D', point: 1.0 },
  { min: 0, letter: 'F', point: 0 },
];

const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const convertScore = (score) => SCALE.find((r) => score >= r.min);

export function classify(gpa4) {
  if (gpa4 >= 3.6) return 'Xuất sắc';
  if (gpa4 >= 3.2) return 'Giỏi';
  if (gpa4 >= 2.5) return 'Khá';
  if (gpa4 >= 2.0) return 'Trung bình';
  return 'Yếu';
}

export function validateCourses(input) {
  if (!Array.isArray(input) || input.length === 0 || input.length > 60) {
    throw new HttpError(400, 'Cần nhập từ 1 đến 60 môn học.');
  }
  return input.map((c, i) => {
    const name = String(c?.name ?? '').trim().slice(0, 100) || `Môn ${i + 1}`;
    const credits = Number(c?.credits);
    const rawScore = c?.score;
    const score = Number(rawScore);
    if (!(credits > 0 && credits <= 20)) {
      throw new HttpError(400, `Số tín chỉ của "${name}" phải lớn hơn 0 và không quá 20.`);
    }
    if (rawScore === '' || rawScore == null || !(score >= 0 && score <= 10)) {
      throw new HttpError(400, `Điểm của "${name}" phải nằm trong khoảng 0 đến 10.`);
    }
    return { name, credits, score };
  });
}

export function calculateGpa(courses) {
  const rows = courses.map((c) => {
    const g = convertScore(c.score);
    return { ...c, letter: g.letter, point: g.point };
  });
  const totalCredits = rows.reduce((s, c) => s + c.credits, 0);
  const sum10 = rows.reduce((s, c) => s + c.score * c.credits, 0);
  const sum4 = rows.reduce((s, c) => s + c.point * c.credits, 0);
  const gpa4 = sum4 / totalCredits;
  return {
    courses: rows,
    totalCredits: round(totalCredits, 1),
    gpa10: round(sum10 / totalCredits),
    gpa4: round(gpa4),
    classification: classify(gpa4),
  };
}

// Điểm thi cuối kỳ cần đạt để tổng kết môn đạt mục tiêu (thang 10).
export function requiredFinal({ components, target }) {
  if (!Array.isArray(components) || components.length < 2 || components.length > 8) {
    throw new HttpError(400, 'Cần từ 2 đến 8 thành phần điểm.');
  }
  const goal = Number(target);
  if (!(goal >= 0 && goal <= 10)) throw new HttpError(400, 'Điểm mục tiêu phải từ 0 đến 10.');

  let known = 0;
  let totalWeight = 0;
  let finalWeight = 0;
  let unknown = 0;
  for (const c of components) {
    const w = Number(c?.weight);
    if (!(w > 0 && w <= 100)) throw new HttpError(400, 'Trọng số mỗi thành phần phải từ 0 đến 100 (%).');
    totalWeight += w;
    if (c.score === null || c.score === '' || c.score === undefined) {
      unknown += 1;
      finalWeight = w;
    } else {
      const s = Number(c.score);
      if (!(s >= 0 && s <= 10)) throw new HttpError(400, 'Điểm thành phần phải từ 0 đến 10.');
      known += (s * w) / 100;
    }
  }
  if (Math.abs(totalWeight - 100) > 0.01) throw new HttpError(400, 'Tổng trọng số phải bằng 100%.');
  if (unknown !== 1) throw new HttpError(400, 'Chỉ để trống điểm của đúng một thành phần (điểm cuối kỳ).');

  const required = (goal - known) / (finalWeight / 100);
  return {
    required: round(Math.max(required, 0)),
    alreadyReached: required <= 0,
    achievable: required <= 10,
  };
}

// GPA trung bình cần đạt ở các tín chỉ còn lại để chạm GPA mục tiêu (thang 4).
export function expectedGpa({ currentGpa, currentCredits, targetGpa, remainingCredits }) {
  const cur = Number(currentGpa);
  const curCr = Number(currentCredits);
  const target = Number(targetGpa);
  const rem = Number(remainingCredits);
  if (!(cur >= 0 && cur <= 4) || !(target >= 0 && target <= 4)) {
    throw new HttpError(400, 'GPA phải nằm trong khoảng 0 đến 4.');
  }
  if (!(curCr >= 0 && curCr <= 400) || !(rem > 0 && rem <= 400)) {
    throw new HttpError(400, 'Số tín chỉ không hợp lệ.');
  }
  const required = (target * (curCr + rem) - cur * curCr) / rem;
  return {
    required: round(Math.max(required, 0)),
    alreadyReached: required <= 0,
    achievable: required <= 4,
  };
}
