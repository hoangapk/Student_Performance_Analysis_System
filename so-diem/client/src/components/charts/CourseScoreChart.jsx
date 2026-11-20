import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function CourseTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const c = payload[0].payload;
  return (
    <div className="rounded-md border border-rule bg-white px-3 py-2 text-sm shadow-sheet">
      <p className="font-semibold">{c.name}</p>
      <p className="num">Điểm {c.score} · {c.letter} · {c.credits} tín chỉ</p>
    </div>
  );
}
const LETTER_COLOR = {
  'A+': '#10b981',
  A: '#10b981',
  'A-': '#14b8a6',
  'B+': '#06b6d4',
  B: '#3b82f6',
  'B-': '#6366f1',
  'C+': '#8b5cf6',
  C: '#f59e0b',
  'C-': '#eab308',
  D: '#f97316',
  F: '#ef4444',
};
const tick = { fontSize: 12, fill: '#5B6B8A' };
const short = (s) => (s.length > 18 ? `${s.slice(0, 17)}…` : s);

export default function CourseScoreChart({ courses }) {
  const height = Math.max(220, courses.length * 40 + 40);
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={courses} layout="vertical" margin={{ top: 4, right: 32, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#DCE8F8" horizontal={false} />
          <XAxis type="number" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={tick} tickLine={false} axisLine={{ stroke: '#CFE0F5' }} />
          <YAxis type="category" dataKey="name" width={124} tick={tick} tickLine={false} axisLine={false} tickFormatter={short} />
          <ReferenceLine x={4} stroke="#D7263D" strokeDasharray="4 4" label={{ value: 'D (4.0)', position: 'top', fontSize: 11, fill: '#D7263D' }} />
          <Tooltip content={<CourseTooltip />} cursor={{ fill: '#EEF4FD' }} />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
            {courses.map((c, i) => (
              <Cell key={i} fill={LETTER_COLOR[c.letter] || '#2B59C3'} />
            ))}
            <LabelList dataKey="score" position="right" fontSize={12} fill="#1B2A49" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
