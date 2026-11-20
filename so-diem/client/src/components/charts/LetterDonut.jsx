import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export const LETTER_COLOR = {
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

export default function LetterDonut({ letters, total }) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col">
      <div className="relative h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={letters} dataKey="count" nameKey="letter" innerRadius={58} outerRadius={86} paddingAngle={2} stroke="#fff" strokeWidth={2}>
              {letters.map((l) => (
                <Cell key={l.letter} fill={LETTER_COLOR[l.letter]} />
              ))}
            </Pie>
            <Tooltip formatter={(v, n) => [`${v} môn`, `Điểm ${n}`]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-hand text-4xl font-bold leading-none text-pen">{total}</span>
          <span className="text-xs text-mute">môn học</span>
        </div>
      </div>
      <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {letters.map((l) => (
          <li key={l.letter} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ background: LETTER_COLOR[l.letter] }} aria-hidden="true" />
            <span className="font-semibold">{l.letter}</span>
            <span className="num ml-auto text-mute">{l.count} môn</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
