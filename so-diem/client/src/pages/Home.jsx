import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import CourseTable, { newCourse } from '../components/CourseTable.jsx';
import AnalysisCard from '../components/AnalysisCard.jsx';

const COURSES_STORAGE_KEY = 'so_diem_courses';
const SEMESTER_STORAGE_KEY = 'so_diem_semester_name';

function parseCredits(rawCredits) {
  const c = parseFloat(String(rawCredits ?? '').replace(',', '.'));
  if (Number.isNaN(c) || c <= 0 || c > 20) return { valid: false, num: 0 };
  return { valid: true, num: c };
}

function evaluateScore(rawScore) {
  const num = parseFloat(String(rawScore ?? '').replace(',', '.'));
  if (rawScore === '' || rawScore === null || rawScore === undefined) {
    return { valid: true, empty: true, num: null, gpa4: null, letter: '-' };
  }
  if (Number.isNaN(num) || num < 0 || num > 10) {
    return { valid: false, empty: false, num: null, gpa4: null, letter: 'Lỗi' };
  }
  if (num >= 9.5) return { valid: true, empty: false, num, gpa4: 4.0, letter: 'A+' };
  if (num >= 8.5) return { valid: true, empty: false, num, gpa4: 4.0, letter: 'A' };
  if (num >= 8.0) return { valid: true, empty: false, num, gpa4: 3.65, letter: 'A-' };
  if (num >= 7.5) return { valid: true, empty: false, num, gpa4: 3.33, letter: 'B+' };
  if (num >= 7.0) return { valid: true, empty: false, num, gpa4: 3.0, letter: 'B' };
  if (num >= 6.5) return { valid: true, empty: false, num, gpa4: 2.65, letter: 'B-' };
  if (num >= 6.0) return { valid: true, empty: false, num, gpa4: 2.33, letter: 'C+' };
  if (num >= 5.5) return { valid: true, empty: false, num, gpa4: 2.0, letter: 'C' };
  if (num >= 4.5) return { valid: true, empty: false, num, gpa4: 1.65, letter: 'C-' };
  if (num >= 4.0) return { valid: true, empty: false, num, gpa4: 1.0, letter: 'D' };
  return { valid: true, empty: false, num, gpa4: 0.0, letter: 'F' };
}

function getClassification(gpa4) {
  if (gpa4 >= 3.6) return 'Xuất sắc';
  if (gpa4 >= 3.2) return 'Giỏi';
  if (gpa4 >= 2.5) return 'Khá';
  if (gpa4 >= 2.0) return 'Trung bình';
  return 'Yếu';
}

function buildGpaResult(courses) {
  let totalCredits = 0;
  let weighted10 = 0;
  let weighted4 = 0;
  const gradedCourses = [];

  for (const c of courses) {
    const cred = parseCredits(c.credits);
    const sc = evaluateScore(c.score);
    if (!cred.valid || !sc.valid || sc.empty || sc.num === null) continue;

    totalCredits += cred.num;
    weighted10 += sc.num * cred.num;
    weighted4 += sc.gpa4 * cred.num;

    gradedCourses.push({
      name: c.name?.trim() || 'Môn chưa đặt tên',
      credits: cred.num,
      score: sc.num,
      letter: sc.letter,
      point: sc.gpa4,
    });
  }

  const gpa10 = totalCredits > 0 ? weighted10 / totalCredits : 0;
  const gpa4 = totalCredits > 0 ? weighted4 / totalCredits : 0;

  return {
    gpa4,
    gpa10,
    totalCredits,
    classification: getClassification(gpa4),
    courses: gradedCourses,
  };
}

const toPayload = (courses, semesterName) =>
  courses.map(({ name, credits, score }) => ({
    name: name.trim(),
    credits: parseFloat(String(credits ?? '').replace(',', '.')),
    score: parseFloat(String(score ?? '').replace(',', '.')),
    semester: semesterName?.trim() || 'Học kỳ hiện tại',
  }));

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState(() => {
    try {
      const saved = localStorage.getItem(COURSES_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const seenIds = new Set();
        return parsed.map((item, idx) => {
          const id =
            item?.id && !seenIds.has(item.id)
              ? item.id
              : `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 8)}`;
          seenIds.add(id);
          return {
            name: typeof item?.name === 'string' ? item.name : '',
            credits: item?.credits ?? '3',
            score: item?.score ?? '',
            ...item,
            id,
          };
        });
      }
    } catch {
      // Bỏ qua nếu trình duyệt chặn localStorage
    }
    return [newCourse(), newCourse(), newCourse(), newCourse()];
  });

  const [semesterName, setSemesterName] = useState(() => {
    try {
      return localStorage.getItem(SEMESTER_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [result, setResult] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const resetDraftData = () => {
    try {
      localStorage.removeItem(COURSES_STORAGE_KEY);
      localStorage.removeItem(SEMESTER_STORAGE_KEY);
    } catch {
      // Bỏ qua
    }
    setCourses([newCourse(), newCourse(), newCourse(), newCourse()]);
    setSemesterName('');
    setResult(null);
    setAnalysis(null);
    setError('');
    setNotice('');
  };

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
      const localResult = buildGpaResult(courses);
      if (localResult.totalCredits === 0) {
        throw new Error('Hãy nhập ít nhất một môn có tín chỉ và điểm hợp lệ.');
      }
      setResult(localResult);
      setAnalysis(null);
    });

  const analyze = () =>
    run('ai', async () => {
      setAnalysis(
        await api('/analysis', {
          method: 'POST',
          body: {
            semesters: [
              {
                name: semesterName || 'Học kỳ hiện tại',
                courses: toPayload(courses, semesterName),
              },
            ],
          },
        }),
      );
    });

  const save = () => {
    if (!user) {
      resetDraftData();
      return navigate('/dang-nhap');
    }
    return run('save', async () => {
      if (!semesterName.trim()) {
        throw new Error('Hãy đặt tên học kỳ trước khi lưu, ví dụ "HK1 2025-2026".');
      }
      await api('/semesters', {
        method: 'POST',
        body: {
          name: semesterName,
          courses: toPayload(courses, semesterName),
        },
      });
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
                      {c.score} → {c.letter} ({c.point.toFixed(2)})
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