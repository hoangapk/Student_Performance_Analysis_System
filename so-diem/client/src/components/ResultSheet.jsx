import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import AnalysisCard from './AnalysisCard.jsx';
import LetterDonut from './charts/LetterDonut.jsx';
import CourseScoreChart from './charts/CourseScoreChart.jsx';
import GpaTrendChart from './charts/GpaTrendChart.jsx';

const LETTERS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];

const LETTER_COLOR = {
  'A+': '#1F7A4D',
  A: '#238B58',
  'A-': '#2E9E66',
  'B+': '#1D6FA5',
  B: '#2589BD',
  'B-': '#43A0D0',
  'C+': '#B7791F',
  C: '#D69E2E',
  'C-': '#ECC94B',
  D: '#C05621',
  F: '#D7263D',
};

const DASHBOARD_CACHE_KEY = 'so_diem_dashboard_semesters';
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

function normalizeChartSummary(rawList) {
  const items = Array.isArray(rawList) ? rawList : [];

  const courses = items
    .map((item, idx) => {
      const score = parseNum(item?.score ?? item?.score10);
      const credits = parseNum(item?.credits);
      if (score === null || score < 0 || score > 10) return null;

      const safeCredits = credits !== null && credits > 0 ? credits : 1;
      const letter = item?.letter || toLetter(score);

      return {
        name: (item?.name || item?.course_name || '').trim() || `Môn ${idx + 1}`,
        score,
        letter,
        point4: toPoint4(score),
        credits: safeCredits,
        semester: item?.semester || item?.term || 'Học kỳ hiện tại',
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

function StudyChartsSection({ semesters }) {
  const [chartSummary, setChartSummary] = useState({
    totalCourses: 0,
    letters: [],
    courses: [],
    trend: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setError('');

    if (Array.isArray(semesters) && semesters.length > 0) {
      const extracted = extractCoursesFromSemesters(semesters);
      setChartSummary(normalizeChartSummary(extracted));
      setLoading(false);
      return () => {
        active = false;
      };
    }

    const localCourses = getLocalCourses();
    if (localCourses) {
      setChartSummary(normalizeChartSummary(localCourses));
      setLoading(false);
      return () => {
        active = false;
      };
    }

    api('/semesters')
      .then((res) => {
        if (!active) return;
        const rawList = extractCoursesFromSemesters(res);
        setChartSummary(normalizeChartSummary(rawList));
      })
      .catch(() => {
        if (!active) return;
        setChartSummary(normalizeChartSummary([]));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [semesters]);

  if (loading) {
    return <div className="card text-sm text-ink/70">Đang tải biểu đồ học tập...</div>;
  }

  if (error) {
    return <div className="card border-rose-200 bg-rose-50 text-sm text-rose-700">{error}</div>;
  }

  if (chartSummary.totalCourses === 0) {
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
        <h3 className="text-xl font-extrabold">Biểu đồ học tập</h3>
        <p className="mt-1 text-sm text-ink/70">
          Phân bố điểm chữ, điểm từng học phần và xu hướng GPA qua các học kỳ.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section className="card">
          <h4 className="mb-4 text-base font-bold">Phân bố điểm chữ</h4>
          <LetterDonut letters={chartSummary.letters} total={chartSummary.totalCourses} />
        </section>

        <section className="card">
          <h4 className="mb-4 text-base font-bold">Điểm từng môn học</h4>
          <CourseScoreChart courses={chartSummary.courses} />
        </section>
      </div>

      <section className="card">
        <h4 className="mb-4 text-base font-bold">Xu hướng GPA theo học kỳ</h4>
        <GpaTrendChart data={chartSummary.trend} />
      </section>
    </div>
  );
}

function toNumberOrNull(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(String(val).replace(',', '.').trim());
  return Number.isNaN(n) ? null : n;
}

function score10ToLetter(score) {
  if (score === null) return '-';
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

function score10ToPoint4(score) {
  if (score === null) return 0;
  if (score >= 8.5) return 4.0;
  if (score >= 8.0) return 3.65;
  if (score >= 7.5) return 3.33;
  if (score >= 7.0) return 3.0;
  if (score >= 6.5) return 2.65;
  if (score >= 6.0) return 2.33;
  if (score >= 5.5) return 2.0;
  if (score >= 4.5) return 1.65;
  if (score >= 4.0) return 1.0;
  return 0.0;
}

function normalizeCourse(c, idx) {
  const score = toNumberOrNull(c?.score ?? c?.score10);
  const credits = toNumberOrNull(c?.credits) ?? 0;
  const rawPoint = toNumberOrNull(c?.point ?? c?.gpa4);
  const point4 = rawPoint !== null ? rawPoint : score10ToPoint4(score);
  const letter =
    typeof c?.letter === 'string' && c.letter.trim() && c.letter.trim() !== '-'
      ? c.letter.trim()
      : score10ToLetter(score);

  return {
    id: c?.id ?? `course-${idx}`,
    name: String(c?.name ?? c?.course_name ?? '').trim() || `Môn học ${idx + 1}`,
    credits,
    score,
    letter,
    point4,
  };
}

function getClassification(gpa4) {
  if (gpa4 >= 3.6) return 'Xuất sắc';
  if (gpa4 >= 3.2) return 'Giỏi';
  if (gpa4 >= 2.5) return 'Khá';
  if (gpa4 >= 2.0) return 'Trung bình';
  return 'Yếu';
}

export function MyTranscriptBoard({ user, authLoading = false }) {
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState([]);
  const [expandedIds, setExpandedIds] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const loadSemesters = useCallback(async () => {
    setLoadingList(true);
    setError('');
    try {
      const data = await api('/semesters');
      const rawList = Array.isArray(data?.semesters) ? data.semesters : [];
      const list = rawList.map((s, sIdx) => {
        const courses = Array.isArray(s?.courses)
          ? s.courses.map((c, cIdx) => normalizeCourse(c, cIdx))
          : [];
        const semCredits = courses.reduce((sum, c) => (c.credits > 0 ? sum + c.credits : sum), 0);
        const semW4 = courses.reduce(
          (sum, c) => (c.credits > 0 ? sum + c.point4 * c.credits : sum),
          0,
        );
        const semW10 = courses.reduce(
          (sum, c) => (c.credits > 0 && c.score !== null ? sum + c.score * c.credits : sum),
          0,
        );

        const apiGpa4 = toNumberOrNull(s?.gpa4);
        const gpa4 = apiGpa4 !== null ? apiGpa4 : semCredits > 0 ? semW4 / semCredits : 0;

        const apiGpa10 = toNumberOrNull(s?.gpa10);
        const gpa10 = apiGpa10 !== null ? apiGpa10 : semCredits > 0 ? semW10 / semCredits : 0;

        const totalCredits = toNumberOrNull(s?.totalCredits) ?? semCredits;
        const classification =
          typeof s?.classification === 'string' && s.classification.trim()
            ? s.classification.trim()
            : getClassification(gpa4);

        return {
          ...s,
          id: s?.id ?? `sem-${sIdx}`,
          name: String(s?.name ?? '').trim() || `Học kỳ ${sIdx + 1}`,
          courses,
          gpa4,
          gpa10,
          totalCredits,
          classification,
        };
      });

      setSemesters(list);
      if (list.length > 0) {
        setExpandedIds((prev) => (Object.keys(prev).length > 0 ? prev : { [list[0].id]: true }));
      }
      try {
        localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(list));
      } catch {
        // Bỏ qua nếu trình duyệt chặn localStorage
      }
    } catch (e) {
      setError(e.message || 'Không tải được bảng điểm.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadSemesters();
    } else if (!authLoading) {
      setSemesters([]);
      setExpandedIds({});
    }
  }, [user, authLoading, loadSemesters]);

  const toggleSemester = (id) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = (open) => {
    const next = {};
    for (const s of semesters) {
      next[s.id] = open;
    }
    setExpandedIds(next);
  };

  const handleAnalyzeAll = async () => {
    setAnalyzing(true);
    setError('');
    try {
      setAnalysis(await api('/analysis', { method: 'POST' }));
    } catch (e) {
      setError(e.message || 'Không thể phân tích bảng điểm.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteSemester = async (id, name) => {
    if (!window.confirm(`Xóa học kỳ "${name}"? Không thể hoàn tác.`)) return;
    setError('');
    setDeletingId(id);
    try {
      await api(`/semesters/${id}`, { method: 'DELETE' });
      setAnalysis(null);
      await loadSemesters();
    } catch (e) {
      setError(e.message || 'Không thể xóa học kỳ.');
    } finally {
      setDeletingId(null);
    }
  };

  const cumulativeStats = useMemo(() => {
    let totalCredits = 0;
    let totalCourses = 0;
    let weighted4 = 0;
    let weighted10 = 0;

    for (const s of semesters) {
      const courses = Array.isArray(s?.courses) ? s.courses : [];
      totalCourses += courses.length;

      let semCredits = 0;
      let semW4 = 0;
      let semW10 = 0;

      for (const c of courses) {
        if (c.credits > 0 && c.score !== null) {
          semCredits += c.credits;
          semW4 += c.point4 * c.credits;
          semW10 += c.score * c.credits;
        }
      }

      if (semCredits > 0) {
        totalCredits += semCredits;
        weighted4 += semW4;
        weighted10 += semW10;
      } else if ((s?.totalCredits ?? 0) > 0) {
        const cr = Number(s.totalCredits);
        totalCredits += cr;
        weighted4 += (Number(s.gpa4) || 0) * cr;
        weighted10 += (Number(s.gpa10) || 0) * cr;
      }
    }

    const gpa4 = totalCredits > 0 ? weighted4 / totalCredits : 0;
    const gpa10 = totalCredits > 0 ? weighted10 / totalCredits : 0;

    return {
      gpa4,
      gpa10,
      totalCredits,
      totalCourses,
      semesterCount: semesters.length,
      classification: totalCredits > 0 ? getClassification(gpa4) : '-',
    };
  }, [semesters]);

  const filteredSemesters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return semesters;
    return semesters.filter((s) => {
      const matchSem = String(s?.name || '').toLowerCase().includes(q);
      const matchCourse = (s?.courses || []).some((c) =>
        String(c?.name || '').toLowerCase().includes(q),
      );
      return matchSem || matchCourse;
    });
  }, [semesters, searchQuery]);

  if (authLoading || loadingList) {
    return <p className="text-sm text-slate-600">Đang tải bảng điểm…</p>;
  }

  if (!user) {
    return (
      <div className="card space-y-3">
        <p className="text-sm text-slate-700">Bạn cần đăng nhập để xem bảng điểm đã lưu.</p>
        <button type="button" className="btn-primary" onClick={() => navigate('/dang-nhap')}>
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Sổ điểm của {user.name}
          </h2>
          <p className="text-sm text-slate-600 sm:text-base">
            Các học kỳ bạn đã lưu, chi tiết từng môn học và biểu đồ học tập.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={loadSemesters}
            disabled={loadingList || analyzing}
          >
            Làm mới
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleAnalyzeAll}
            disabled={analyzing || semesters.length === 0}
          >
            {analyzing ? 'AI đang phân tích…' : 'Phân tích toàn bộ bằng AI'}
          </button>
        </div>
      </div>

      {semesters.length > 0 && (
        <section aria-label="Tổng hợp tích lũy" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="card !p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              GPA tích lũy (/4)
            </p>
            <p className="mt-1 text-2xl font-black text-slate-900">
              <span className="highlight">{cumulativeStats.gpa4.toFixed(2)}</span>
            </p>
            <p className="mt-0.5 text-xs font-semibold text-emerald-700">
              {cumulativeStats.classification}
            </p>
          </div>
          <div className="card !p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              TB tích lũy (/10)
            </p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {cumulativeStats.gpa10.toFixed(2)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {cumulativeStats.semesterCount} học kỳ
            </p>
          </div>
          <div className="card !p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tổng tín chỉ
            </p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {cumulativeStats.totalCredits}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Đã tích lũy</p>
          </div>
          <div className="card !p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tổng số môn
            </p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {cumulativeStats.totalCourses}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Học phần đã lưu</p>
          </div>
        </section>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-rose-600">
          {error}
        </p>
      )}

      {semesters.length === 0 ? (
        <div className="card">
          <p className="text-sm text-slate-700">
            Bạn chưa lưu học kỳ nào. Nhập điểm ở trang{' '}
            <Link className="font-semibold text-teal-700 underline" to="/">
              Tính GPA
            </Link>{' '}
            rồi bấm &ldquo;Lưu học kỳ&rdquo;.
          </p>
        </div>
      ) : (
        <>
          {/* Thay thế GPA theo học kỳ (thang 4) bằng phần StudyCharts */}
          <StudyChartsSection semesters={semesters} />

          <section className="card space-y-4" aria-label="Danh sách học kỳ và chi tiết môn học">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Chi tiết các học kỳ &amp; môn học
                </h3>
                <p className="text-xs text-slate-500">
                  Bấm vào từng học kỳ để xem hoặc thu gọn bảng điểm chi tiết từng môn.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="search"
                  className="field !w-48 !py-1.5 text-sm sm:!w-60"
                  placeholder="Tìm học kỳ hoặc môn học…"
                  aria-label="Tìm học kỳ hoặc môn học"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-ghost !px-2.5 !py-1.5 text-xs"
                  onClick={() => expandAll(true)}
                >
                  Mở tất cả
                </button>
                <button
                  type="button"
                  className="btn-ghost !px-2.5 !py-1.5 text-xs"
                  onClick={() => expandAll(false)}
                >
                  Thu gọn
                </button>
              </div>
            </div>

            {filteredSemesters.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-600">
                Không tìm thấy học kỳ hoặc môn học khớp với &ldquo;{searchQuery}&rdquo;.
              </p>
            ) : (
              <ul className="space-y-3">
                {filteredSemesters.map((s) => {
                  const courses = Array.isArray(s?.courses) ? s.courses : [];
                  const isOpen = Boolean(expandedIds[s.id]);

                  return (
                    <li
                      key={s.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleSemester(s.id)}
                          aria-expanded={isOpen}
                          className="flex flex-1 items-center justify-between gap-3 text-left"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-900">{s.name}</span>
                              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                {courses.length} môn · {s.totalCredits} TC
                              </span>
                              {s.classification && (
                                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                                  {s.classification}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500">
                              TB thang 10: {Number(s.gpa10 ?? 0).toFixed(2)} ·{' '}
                              {isOpen ? 'Nhấn để ẩn danh sách môn' : 'Nhấn để xem chi tiết môn học'}
                            </p>
                          </div>
                        </button>

                        <div className="flex items-center gap-3">
                          <p className="text-lg font-extrabold text-slate-900">
                            {Number(s.gpa4 ?? 0).toFixed(2)}
                            <span className="text-sm font-medium text-slate-500"> / 4</span>
                          </p>
                          <button
                            type="button"
                            className="btn-ghost !px-2.5 !py-1 text-xs"
                            disabled={deletingId === s.id}
                            onClick={() => handleDeleteSemester(s.id, s.name)}
                          >
                            {deletingId === s.id ? 'Đang xóa…' : 'Xóa'}
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="rounded-b-xl border-t border-slate-200 bg-white px-4 py-3">
                          {courses.length === 0 ? (
                            <p className="text-xs text-slate-500">Học kỳ này chưa có môn học chi tiết.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse text-left text-sm">
                                <thead>
                                  <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <th className="py-2 pr-3">#</th>
                                    <th className="py-2 pr-3">Môn học</th>
                                    <th className="px-2 py-2 text-center">Tín chỉ</th>
                                    <th className="px-2 py-2 text-center">Điểm /10</th>
                                    <th className="px-2 py-2 text-center">Điểm chữ</th>
                                    <th className="py-2 pl-2 text-right">Hệ 4</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {courses.map((c, idx) => {
                                    const letter = c.letter || '-';
                                    const badgeColor = LETTER_COLOR[letter] || '#475569';

                                    return (
                                      <tr key={c.id} className="hover:bg-slate-50/80">
                                        <td className="py-2 pr-3 font-mono text-xs text-slate-400">
                                          {idx + 1}
                                        </td>
                                        <td className="py-2 pr-3 font-medium text-slate-900">
                                          {c.name}
                                        </td>
                                        <td className="px-2 py-2 text-center font-mono text-xs font-semibold text-slate-700">
                                          {c.credits}
                                        </td>
                                        <td className="px-2 py-2 text-center font-mono text-sm font-bold text-slate-900">
                                          {c.score === null ? '-' : c.score.toFixed(1)}
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                          <span
                                            className="inline-block rounded px-2 py-0.5 text-xs font-extrabold text-white"
                                            style={{ backgroundColor: badgeColor }}
                                          >
                                            {letter}
                                          </span>
                                        </td>
                                        <td className="py-2 pl-2 text-right font-mono text-sm font-bold text-slate-900">
                                          {Number(c.point4 ?? 0).toFixed(2)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}

      {analysis && <AnalysisCard result={analysis} />}
    </div>
  );
}

export default function ResultSheet({
  summary,
  busy,
  user,
  authLoading = false,
  onAnalyze,
  onSave,
  error,
  notice,
  semesterName,
  courses,
  defaultShowTranscript = false,
}) {
  const navigate = useNavigate();
  const [showTranscript, setShowTranscript] = useState(defaultShowTranscript);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState('');
  const [localNotice, setLocalNotice] = useState('');

  useEffect(() => {
    if (defaultShowTranscript) {
      setShowTranscript(true);
    }
  }, [defaultShowTranscript]);

  const safeSummary = summary || {};
  const distribution = safeSummary.distribution || {};
  const has = typeof safeSummary.gpa4 === 'number' && !Number.isNaN(safeSummary.gpa4);
  const maxCount = Math.max(1, ...Object.values(distribution));
  const letters = LETTERS.filter((l) => distribution[l]);

  const handleSave = async () => {
    setLocalError('');
    setLocalNotice('');

    if (!user) {
      return navigate('/dang-nhap');
    }

    if (typeof onSave === 'function') {
      await onSave();
      return;
    }

    if (!semesterName?.trim()) {
      setLocalError('Hãy đặt tên học kỳ trước khi lưu, ví dụ "HK1 2025-2026".');
      return;
    }

    setSaving(true);
    try {
      await api('/semesters', {
        method: 'POST',
        body: {
          name: semesterName.trim(),
          courses,
        },
      });
      setLocalNotice('Đã lưu học kỳ vào Sổ điểm của bạn.');
    } catch (e) {
      setLocalError(e.message || 'Không thể lưu học kỳ.');
    } finally {
      setSaving(false);
    }
  };

  const displayError = error || localError;
  const displayNotice = notice || localNotice;
  const isBusy = Boolean(busy) || saving;

  return (
    <div className="space-y-6">
      {!defaultShowTranscript && (
        <aside className="card" aria-live="polite" aria-label="Phiếu điểm tạm tính">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Phiếu điểm tạm tính
            </p>
            <button
              type="button"
              className="btn-ghost !px-2.5 !py-1 text-xs"
              onClick={() => setShowTranscript((prev) => !prev)}
            >
              {showTranscript ? 'Ẩn bảng điểm của tôi' : 'Bảng điểm của tôi'}
            </button>
          </div>

          {has ? (
            <div className="mt-3 space-y-5">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <div className="relative inline-block px-3 py-1">
                  <span className="text-5xl font-black leading-none text-slate-900">
                    <span className="highlight">{Number(safeSummary.gpa4).toFixed(2)}</span>
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">GPA thang 4</p>
                  <span className="mt-1 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                    {safeSummary.classification || 'Đang cập nhật'}
                  </span>
                </div>
              </div>

              <dl className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-slate-50 px-2 py-2 ring-1 ring-inset ring-slate-200/70">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    TB thang 10
                  </dt>
                  <dd className="text-lg font-extrabold text-slate-900">
                    {Number(safeSummary.gpa10 ?? 0).toFixed(2)}
                  </dd>
                </div>
                <div className="rounded-md bg-slate-50 px-2 py-2 ring-1 ring-inset ring-slate-200/70">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Tín chỉ
                  </dt>
                  <dd className="text-lg font-extrabold text-slate-900">
                    {safeSummary.gradedCredits ?? 0}
                  </dd>
                </div>
                <div className="rounded-md bg-slate-50 px-2 py-2 ring-1 ring-inset ring-slate-200/70">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Đã nhập
                  </dt>
                  <dd className="text-lg font-extrabold text-slate-900">
                    {safeSummary.completionRate ?? 0}%
                  </dd>
                </div>
              </dl>

              {letters.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Phân bố điểm chữ
                  </p>
                  <ul className="space-y-1.5">
                    {letters.map((l) => (
                      <li key={l} className="flex items-center gap-2 text-sm">
                        <span className="w-7 font-bold">{l}</span>
                        <span
                          className="h-3 rounded-sm transition-all duration-300"
                          style={{
                            width: `${(distribution[l] / maxCount) * 100}%`,
                            minWidth: 8,
                            background: LETTER_COLOR[l] || '#2563eb',
                          }}
                        />
                        <span className="text-xs font-semibold text-slate-600">{distribution[l]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {safeSummary.highest && (
                <p className="border-t border-slate-200 pt-3 text-sm leading-relaxed">
                  <span className="font-semibold text-[#1F7A4D]">Cao nhất:</span>{' '}
                  {safeSummary.highest.label} ({safeSummary.highest.score})
                  {safeSummary.lowest && safeSummary.lowest.label !== safeSummary.highest.label && (
                    <>
                      <br />
                      <span className="font-semibold text-[#8A5A07]">Thấp nhất:</span>{' '}
                      {safeSummary.lowest.label} ({safeSummary.lowest.score})
                    </>
                  )}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-3 rounded-md border-2 border-dashed border-slate-200 p-5 text-sm text-slate-600">
              Nhập điểm ít nhất một môn rồi bấm &ldquo;Tính GPA&rdquo; để xem phiếu điểm, phân bố điểm chữ và nhận xét tại đây.
            </div>
          )}

          <div className="mt-5 grid gap-2">
            {typeof onAnalyze === 'function' && (
              <button
                type="button"
                className="btn-primary w-full"
                onClick={onAnalyze}
                disabled={isBusy || !has}
              >
                {busy === 'ai' ? 'AI đang phân tích…' : 'Phân tích bằng AI'}
              </button>
            )}
            <button
              type="button"
              className="btn-ghost w-full"
              onClick={handleSave}
              disabled={isBusy || (!has && Boolean(user))}
            >
              {busy === 'save' || saving
                ? 'Đang lưu…'
                : user
                  ? 'Lưu học kỳ'
                  : 'Đăng nhập để lưu'}
            </button>
          </div>

          {displayError && (
            <p role="alert" className="mt-3 text-sm font-medium text-rose-600">
              {displayError}
            </p>
          )}
          {displayNotice && (
            <p role="status" className="mt-3 text-sm font-medium text-emerald-700">
              {displayNotice}
            </p>
          )}
        </aside>
      )}

      {(showTranscript || defaultShowTranscript) && (
        <MyTranscriptBoard user={user} authLoading={authLoading} />
      )}
    </div>
  );
}