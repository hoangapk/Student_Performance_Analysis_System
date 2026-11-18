import React, { useMemo, useRef, useState } from 'react';

let counter = 0;
export const newCourse = () => ({
  id: ++counter,
  name: '',
  credits: '3',
  score: '',
});

// Quy đổi điểm thang 10 -> thang 4 & xếp loại nhanh để hiển thị trực quan
function evaluateScore(rawScore) {
  const num = parseFloat(String(rawScore ?? '').replace(',', '.'));
  if (rawScore === '' || rawScore === null || rawScore === undefined) {
    return { valid: true, empty: true, num: null, gpa4: null, letter: '-', badge: 'bg-slate-100 text-slate-400' };
  }
  if (Number.isNaN(num) || num < 0 || num > 10) {
    return {
      valid: false,
      empty: false,
      num: null,
      gpa4: null,
      letter: 'Lỗi',
      badge: 'bg-rose-100 text-rose-700 ring-1 ring-rose-300',
    };
  }

  if (num >= 9.5) {
    return { valid: true, empty: false, num, gpa4: 4.0, letter: 'A+', badge: 'bg-emerald-100 text-emerald-800' };
  }
  if (num >= 8.5) {
    return { valid: true, empty: false, num, gpa4: 4.0, letter: 'A', badge: 'bg-emerald-100 text-emerald-800' };
  }
  if (num >= 8.0) {
    return { valid: true, empty: false, num, gpa4: 3.65, letter: 'A-', badge: 'bg-teal-100 text-teal-800' };
  }
  if (num >= 7.5) {
    return { valid: true, empty: false, num, gpa4: 3.33, letter: 'B+', badge: 'bg-cyan-100 text-cyan-800' };
  }
  if (num >= 7.0) {
    return { valid: true, empty: false, num, gpa4: 3.0, letter: 'B', badge: 'bg-indigo-100 text-indigo-800' };
  }
  if (num >= 6.5) {
    return { valid: true, empty: false, num, gpa4: 2.65, letter: 'B-', badge: 'bg-blue-100 text-blue-800' };
  }
  if (num >= 6.0) {
    return { valid: true, empty: false, num, gpa4: 2.33, letter: 'C+', badge: 'bg-sky-100 text-sky-800' };
  }
  if (num >= 5.5) {
    return { valid: true, empty: false, num, gpa4: 2.0, letter: 'C', badge: 'bg-amber-100 text-amber-800' };
  }
  if (num >= 4.5) {
    return { valid: true, empty: false, num, gpa4: 1.65, letter: 'C-', badge: 'bg-yellow-100 text-yellow-800' };
  }
  if (num >= 4.0) {
    return { valid: true, empty: false, num, gpa4: 1.0, letter: 'D', badge: 'bg-orange-100 text-orange-800' };
  }
  return { valid: true, empty: false, num, gpa4: 0.0, letter: 'F', badge: 'bg-rose-100 text-rose-700' };
}

export function parseCredits(rawCredits) {
  const c = parseFloat(String(rawCredits ?? '').replace(',', '.'));
  if (Number.isNaN(c) || c <= 0 || c > 20) return { valid: false, num: 0 };
  return { valid: true, num: c };
}

export default function CourseTable({ courses, setCourses }) {
  const inputRefs = useRef({});
  const [confirmReset, setConfirmReset] = useState(false);

  const update = (id, field, value) => {
    setCourses((cs) => cs.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const remove = (id) => {
    setCourses((cs) => {
      if (cs.length <= 1) {
        return [{ ...newCourse(), id: cs[0]?.id ?? ++counter }];
      }
      return cs.filter((c) => c.id !== id);
    });
  };

  const addRows = (count = 1, focusNew = false) => {
    const created = Array.from({ length: count }, () => newCourse());
    setCourses((cs) => [...cs, ...created]);
    if (focusNew && created.length > 0) {
      const targetId = created[0].id;
      requestAnimationFrame(() => {
        inputRefs.current[`${targetId}-name`]?.focus();
      });
    }
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    const fresh = newCourse();
    setCourses([fresh]);
    setConfirmReset(false);
    requestAnimationFrame(() => {
      inputRefs.current[`${fresh.id}-name`]?.focus();
    });
  };

  // Tính toán thống kê tạm thời ngay trên bảng
  const stats = useMemo(() => {
    let totalCredits = 0;
    let weighted10 = 0;
    let weighted4 = 0;
    let gradedCount = 0;
    let invalidCount = 0;

    for (const c of courses) {
      const cred = parseCredits(c.credits);
      const sc = evaluateScore(c.score);
      if (!cred.valid || !sc.valid) {
        invalidCount += 1;
        continue;
      }
      if (!sc.empty && sc.num !== null) {
        gradedCount += 1;
        totalCredits += cred.num;
        weighted10 += sc.num * cred.num;
        weighted4 += sc.gpa4 * cred.num;
      }
    }

    return {
      totalRows: courses.length,
      gradedCount,
      invalidCount,
      totalCredits,
      avg10: totalCredits > 0 ? (weighted10 / totalCredits).toFixed(2) : '--',
      avg4: totalCredits > 0 ? (weighted4 / totalCredits).toFixed(2) : '--',
    };
  }, [courses]);

  const handleScoreKeyDown = (e, course, index) => {
    if (e.key === 'Enter' && index === courses.length - 1) {
      e.preventDefault();
      addRows(1, true);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      {/* Thanh Header & Live Preview Stats */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">Bảng nhập điểm học phần</h4>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
              {stats.totalRows} môn
            </span>
            {stats.invalidCount > 0 && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                {stats.invalidCount} dòng cần kiểm tra
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Nhấn <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600">Enter</kbd> ở ô điểm cuối để thêm nhanh môn mới
          </p>
        </div>

        {/* Chỉ số tạm tính */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5">
            <span className="text-slate-400">Tín chỉ: </span>
            <strong className="font-bold text-slate-800">{stats.totalCredits}</strong>
          </div>
          <div className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5">
            <span className="text-slate-400">TB /10: </span>
            <strong className="font-bold text-slate-800">{stats.avg10}</strong>
          </div>
          <div className="rounded-lg border border-indigo-200/80 bg-indigo-50/80 px-2.5 py-1.5">
            <span className="text-indigo-600">TB /4: </span>
            <strong className="font-extrabold text-indigo-900">{stats.avg4}</strong>
          </div>
        </div>
      </div>

      {/* Tiêu đề cột */}
      <div className="hidden grid-cols-[minmax(0,1fr)_5.25rem_5.5rem_3.25rem_2.25rem] items-center gap-2.5 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 sm:grid sm:px-5">
        <span>Môn học</span>
        <span className="text-center">Tín chỉ</span>
        <span className="text-center">Điểm /10</span>
        <span className="text-center">Mức</span>
        <span className="sr-only">Thao tác</span>
      </div>

      {/* Danh sách môn học */}
      <ul className="divide-y divide-slate-100 px-3 py-2 sm:px-5">
        {courses.map((c, i) => {
          const scoreInfo = evaluateScore(c.score);
          const creditInfo = parseCredits(c.credits);
          const hasRowError = !scoreInfo.valid || !creditInfo.valid;

          return (
            <li
              key={c.id}
              className={`group grid grid-cols-1 gap-2.5 rounded-xl py-2.5 transition-colors sm:grid-cols-[minmax(0,1fr)_5.25rem_5.5rem_3.25rem_2.25rem] sm:items-center ${hasRowError
                  ? 'bg-rose-50/50 px-2 ring-1 ring-inset ring-rose-200/80'
                  : 'hover:bg-slate-50/80 sm:px-1'
                }`}
            >
              {/* Tên môn học */}
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 font-mono text-[11px] font-bold text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-700">
                  {i + 1}
                </span>
                <input
                  ref={(el) => {
                    inputRefs.current[`${c.id}-name`] = el;
                  }}
                  className="w-full rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  aria-label={`Tên môn học ${i + 1}`}
                  placeholder={`Ví dụ: Cấu trúc dữ liệu ${i + 1}`}
                  value={c.name}
                  maxLength={100}
                  onChange={(e) => update(c.id, 'name', e.target.value)}
                />
              </div>

              {/* Cụm Tín chỉ + Điểm + Mức xếp loại trên mobile / desktop */}
              <div className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-2 pl-8 sm:contents">
                {/* Tín chỉ */}
                <div className="relative">
                  <span className="mb-1 block text-[10px] font-semibold text-slate-400 sm:hidden">
                    Tín chỉ
                  </span>
                  <input
                    className={`w-full rounded-lg border px-2.5 py-2 text-center font-mono text-sm font-semibold transition-all focus:outline-none focus:ring-2 ${!creditInfo.valid
                        ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500/20'
                        : 'border-slate-200/90 bg-white text-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                      }`}
                    aria-label={`Số tín chỉ môn ${i + 1}`}
                    inputMode="decimal"
                    placeholder="3"
                    value={c.credits}
                    onChange={(e) => update(c.id, 'credits', e.target.value.replace(',', '.'))}
                  />
                </div>

                {/* Điểm /10 */}
                <div>
                  <span className="mb-1 block text-[10px] font-semibold text-slate-400 sm:hidden">
                    Điểm /10
                  </span>
                  <input
                    className={`w-full rounded-lg border px-2.5 py-2 text-center font-mono text-sm font-bold transition-all focus:outline-none focus:ring-2 ${!scoreInfo.valid
                        ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500/20'
                        : 'border-slate-200/90 bg-white text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20'
                      }`}
                    aria-label={`Điểm môn ${i + 1}`}
                    inputMode="decimal"
                    placeholder="8.5"
                    value={c.score}
                    onKeyDown={(e) => handleScoreKeyDown(e, c, i)}
                    onChange={(e) => update(c.id, 'score', e.target.value.replace(',', '.'))}
                  />
                </div>

                {/* Badge xếp loại nhanh */}
                <div className="flex justify-center pt-4 sm:pt-0">
                  <span
                    title={
                      scoreInfo.valid && !scoreInfo.empty
                        ? `Quy đổi thang 4: ${scoreInfo.gpa4.toFixed(1)}`
                        : 'Chưa có điểm hợp lệ'
                    }
                    className={`inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-md px-2 text-xs font-extrabold ${scoreInfo.badge}`}
                  >
                    {scoreInfo.letter}
                  </span>
                </div>

                {/* Nút xóa dòng */}
                <div className="flex justify-end pt-4 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    aria-label={`Xóa môn ${i + 1}`}
                    title="Xóa dòng này"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Thanh thao tác phía dưới */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => addRows(1, true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-[0.98]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Thêm môn học</span>
          </button>

          <button
            type="button"
            onClick={() => addRows(3, true)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
          >
            +3 dòng
          </button>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${confirmReset
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'
            }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{confirmReset ? 'Bấm lần nữa để làm mới' : 'Làm mới bảng'}</span>
        </button>
      </div>
    </div>
  );
}