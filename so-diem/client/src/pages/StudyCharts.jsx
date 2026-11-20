import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import LetterDonut from '../components/charts/LetterDonut.jsx';
import CourseScoreChart from '../components/charts/CourseScoreChart.jsx';
import GpaTrendChart from '../components/charts/GpaTrendChart.jsx';

const STORAGE_KEY = 'so_diem_courses';

function toLetter(score) {
  if (score >= 9.5) return 'A+';
  if (score >= 8.5) return 'A';
  if (score >= 8.0) return 'A-';
  if (score >= 7.5) return 'B+';
  if (score >= 7.0) return 'B';
  if (score >= 6.5) return 'B-';
  if (score >= 6.0) return 'C+';
  if (score >= 5.5) return 'C';
  if (score >= 4.5) return 'C-';
  if (score >= 4.0) return 'D';
  return 'F';
}

function toPoint4(score) {
  if (score >= 8.5) return 4.0;
  if (score >= 8.0) return 3.65;
  if (score >= 7.5) return 3.33;
  if (score >= 7.0) return 3.0;
  if (score >= 6.5) return 2.65;
  if (score >= 6.0) return 2.33;
  if (score >= 5.5) return 2.0;
  if (score >= 4.5) return 1.65;
  if (score >= 4.0) return 1.0;
  return 0;
}

function parseNum(val) {
  const n = parseFloat(String(val ?? '').replace(',', '.').trim());
  return Number.isNaN(n) ? null : n;
}

function normalizeSummary(rawList) {
  const items = Array.isArray(rawList) ? rawList : [];

  const courses = items
    .map((item, idx) => {
      const score = parseNum(item.score);
      const credits = parseNum(item.credits);
      if (score === null || score < 0 || score > 10) return null;

      const safeCredits = credits !== null && credits > 0 ? credits : 1;
      const letter = item.letter || toLetter(score);

      return {
        name: (item.name || item.course_name || '').trim() || `Môn ${idx + 1}`,
        score,
        letter,
        point4: toPoint4(score),
        credits: safeCredits,
        semester: item.semester || item.term || 'Học kỳ hiện tại',
      };
    })
    .filter(Boolean);

  const letterMap = new Map();
  for (const c of courses) {
    letterMap.set(c.letter, (letterMap.get(c.letter) || 0) + 1);
  }
  const letters = Array.from(letterMap.entries()).map(([letter, count]) => ({
    letter,
    count,
  }));

  const semMap = new Map();
  for (const c of courses) {
    const entry = semMap.get(c.semester) || {
      name: c.semester,
      credits: 0,
      w4: 0,
      w10: 0,
    };
    entry.credits += c.credits;
    entry.w4 += c.point4 * c.credits;
    entry.w10 += c.score * c.credits;
    semMap.set(c.semester, entry);
  }

  let cumCredits = 0;
  let cumW4 = 0;
  const trend = Array.from(semMap.values()).map((s) => {
    const gpa4 = s.credits > 0 ? s.w4 / s.credits : 0;
    const gpa10 = s.credits > 0 ? s.w10 / s.credits : 0;
    cumCredits += s.credits;
    cumW4 += s.w4;
    const cumGpa4 = cumCredits > 0 ? cumW4 / cumCredits : 0;

    return {
      name: s.name,
      gpa4,
      cumGpa4,
      credits: s.credits,
      gpa10,
    };
  });

  return {
    totalCourses: courses.length,
    letters,
    courses,
    trend,
  };
}

function getLocalCourses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const hasScore = parsed.some((c) => String(c?.score ?? '').trim() !== '');
    return hasScore ? parsed : null;
  } catch {
    return null;
  }
}

function extractCoursesFromSemesters(res) {
  const semesters = Array.isArray(res) ? res : res?.semesters || res?.data || [];
  if (!Array.isArray(semesters)) return [];

  const list = [];
  for (const sem of semesters) {
    const semName = sem?.name || sem?.semester_name || sem?.title || 'Học kỳ';
    const semCourses = Array.isArray(sem?.courses)
      ? sem.courses
      : Array.isArray(sem?.items)
        ? sem.items
        : [];

    for (const c of semCourses) {
      list.push({
        ...c,
        semester: c?.semester || c?.term || semName,
      });
    }
  }
  return list;
}

export default function StudyCharts() {
  const [summary, setSummary] = useState({
    totalCourses: 0,
    letters: [],
    courses: [],
    trend: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const localCourses = getLocalCourses();

    if (localCourses) {
      setSummary(normalizeSummary(localCourses));
      setLoading(false);
      return () => {
        active = false;
      };
    }

    api('/semesters')
      .then((res) => {
        if (!active) return;
        const rawList = extractCoursesFromSemesters(res);
        setSummary(normalizeSummary(rawList));
      })
      .catch(() => {
        if (!active) return;
        setSummary(normalizeSummary([]));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="card text-sm text-ink/70">Đang tải biểu đồ học tập...</div>;
  }

  if (error) {
    return <div className="card border-rose-200 bg-rose-50 text-sm text-rose-700">{error}</div>;
  }

  if (summary.totalCourses === 0) {
    return (
      <div className="card space-y-3 text-sm text-ink/70">
        <p>Chưa có dữ liệu điểm hợp lệ để vẽ biểu đồ.</p>
        <Link to="/" className="btn-primary w-fit">
          Quay lại nhập điểm GPA
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-xl font-extrabold">Biểu đồ học tập</h1>
        <p className="mt-1 text-sm text-ink/70">
          Phân bố điểm chữ, điểm từng học phần và xu hướng GPA qua các học kỳ.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section className="card">
          <h2 className="mb-4 text-base font-bold">Phân bố điểm chữ</h2>
          <LetterDonut letters={summary.letters} total={summary.totalCourses} />
        </section>

        <section className="card">
          <h2 className="mb-4 text-base font-bold">Điểm từng môn học</h2>
          <CourseScoreChart courses={summary.courses} />
        </section>
      </div>

      <section className="card">
        <h2 className="mb-4 text-base font-bold">Xu hướng GPA theo học kỳ</h2>
        <GpaTrendChart data={summary.trend} />
      </section>
    </div>
  );
}