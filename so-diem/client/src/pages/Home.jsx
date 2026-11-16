import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import CourseTable, { newCourse } from '../components/CourseTable.jsx';
import AnalysisCard from '../components/AnalysisCard.jsx';

const toPayload = (courses) => courses.map(({ name, credits, score }) => ({ name, credits, score }));

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState(() => [newCourse(), newCourse(), newCourse(), newCourse()]);
  const [semesterName, setSemesterName] = useState('');
  const [result, setResult] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const run = async (kind, fn) => {
    setBusy(kind);
    setError('');
    setNotice('');
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  const calculate = () =>
    run('calc', async () => {
      setResult(await api('/gpa/calculate', { method: 'POST', body: { courses: toPayload(courses) } }));
      setAnalysis(null);
    });

  const analyze = () =>
    run('ai', async () => {
      setAnalysis(
        await api('/analysis', {
          method: 'POST',
          body: { semesters: [{ name: semesterName || 'Học kỳ hiện tại', courses: toPayload(courses) }] },
        }),
      );
    });

  const save = () => {
    if (!user) return navigate('/dang-nhap');
    return run('save', async () => {
      if (!semesterName.trim()) throw new Error('Hãy đặt tên học kỳ trước khi lưu, ví dụ "HK1 2025-2026".');
      await api('/semesters', { method: 'POST', body: { name: semesterName, courses: toPayload(courses) } });
      setNotice('Đã lưu học kỳ vào Sổ điểm của bạn.');
    });
  };

  return (
    <div className="space-y-10">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
          Nhập điểm, xem <span className="highlight">GPA</span>, biết cần cải thiện môn nào
        </h1>
        <p className="mt-3 max-w-prose text-lg text-ink/80">
          Miễn phí, không cần đăng ký để tính. Đăng nhập khi bạn muốn lưu từng học kỳ và xem biểu đồ GPA.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="card">
          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-semibold">Tên học kỳ</span>
            <input
              className="field"
              placeholder="HK1 2025-2026"
              value={semesterName}
              maxLength={100}
              onChange={(e) => setSemesterName(e.target.value)}
            />
          </label>
          <CourseTable courses={courses} setCourses={setCourses} />
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={calculate} disabled={!!busy}>
              {busy === 'calc' ? 'Đang tính…' : 'Tính GPA'}
            </button>
            <button type="button" className="btn-ghost" onClick={analyze} disabled={!!busy}>
              {busy === 'ai' ? 'AI đang phân tích…' : 'Phân tích bằng AI'}
            </button>
            <button type="button" className="btn-ghost" onClick={save} disabled={!!busy}>
              {user ? 'Lưu học kỳ' : 'Đăng nhập để lưu'}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm font-medium text-danger">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="mt-3 text-sm font-medium text-pine">
              {notice}
            </p>
          )}
        </div>

        <div className="card" aria-live="polite">
          {result ? (
            <div>
              <p className="text-sm font-semibold text-ink/70">GPA thang 4</p>
              <p className="text-6xl font-extrabold">
                <span className="highlight">{result.gpa4.toFixed(2)}</span>
              </p>
              <p className="mt-2 text-lg">
                {result.classification} · {result.gpa10.toFixed(2)}/10 · {result.totalCredits} tín chỉ
              </p>
              <ul className="mt-4 divide-y divide-rule border-t border-rule text-sm">
                {result.courses.map((c, i) => (
                  <li key={i} className="flex justify-between py-1.5">
                    <span className="truncate pr-2">{c.name}</span>
                    <span className="shrink-0 font-medium">
                      {c.score} → {c.letter} ({c.point.toFixed(1)})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-ink/70">
              Điền điểm từng môn rồi bấm "Tính GPA". Kết quả theo thang 10 và thang 4 sẽ hiện ở đây.
            </p>
          )}
        </div>
      </section>

      {analysis && <AnalysisCard result={analysis} />}
    </div>
  );
}
