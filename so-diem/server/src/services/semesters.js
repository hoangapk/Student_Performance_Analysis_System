import { pool } from '../db.js';

// Trả về [{ id, name, createdAt, courses: [{ name, credits, score }] }]
export async function loadSemesters(userId) {
  const [sems] = await pool.execute(
    'SELECT id, name, created_at FROM semesters WHERE user_id = ? ORDER BY id',
    [userId],
  );
  if (sems.length === 0) return [];
  const [rows] = await pool.query(
    'SELECT semester_id, name, credits, score10 FROM courses WHERE semester_id IN (?) ORDER BY id',
    [sems.map((s) => s.id)],
  );
  return sems.map((s) => ({
    id: s.id,
    name: s.name,
    createdAt: s.created_at,
    courses: rows
      .filter((r) => r.semester_id === s.id)
      .map((r) => ({ name: r.name, credits: Number(r.credits), score: Number(r.score10) })),
  }));
}
