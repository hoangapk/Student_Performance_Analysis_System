let counter = 0;
export const newCourse = () => ({ id: ++counter, name: '', credits: '3', score: '' });

export default function CourseTable({ courses, setCourses }) {
  const update = (id, field, value) =>
    setCourses((cs) => cs.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  const remove = (id) => setCourses((cs) => (cs.length > 1 ? cs.filter((c) => c.id !== id) : cs));

  return (
    <div>
      <div className="grid grid-cols-[1fr_4.5rem_4.5rem_2rem] gap-2 px-1 pb-1 text-sm font-semibold text-ink/70">
        <span>Môn học</span>
        <span>Tín chỉ</span>
        <span>Điểm /10</span>
        <span />
      </div>
      <ul className="space-y-2">
        {courses.map((c, i) => (
          <li key={c.id} className="grid grid-cols-[1fr_4.5rem_4.5rem_2rem] gap-2">
            <input
              className="field"
              aria-label={`Tên môn học ${i + 1}`}
              placeholder={`Môn ${i + 1}`}
              value={c.name}
              maxLength={100}
              onChange={(e) => update(c.id, 'name', e.target.value)}
            />
            <input
              className="field"
              aria-label={`Số tín chỉ môn ${i + 1}`}
              inputMode="decimal"
              value={c.credits}
              onChange={(e) => update(c.id, 'credits', e.target.value)}
            />
            <input
              className="field"
              aria-label={`Điểm môn ${i + 1}`}
              inputMode="decimal"
              placeholder="8.5"
              value={c.score}
              onChange={(e) => update(c.id, 'score', e.target.value.replace(',', '.'))}
            />
            <button
              type="button"
              onClick={() => remove(c.id)}
              disabled={courses.length === 1}
              aria-label={`Xóa môn ${i + 1}`}
              className="rounded text-xl text-ink/50 hover:text-danger disabled:opacity-30"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setCourses((cs) => [...cs, newCourse()])}
        className="btn-ghost mt-3"
      >
        Thêm môn học
      </button>
    </div>
  );
}
