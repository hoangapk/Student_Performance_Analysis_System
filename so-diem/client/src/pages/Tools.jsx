import { useState, useMemo } from 'react';
import { api } from '../api.js';

// Bộ Icon SVG tối giản, sắc nét
const Icons = {
  Calculator: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  Target: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Plus: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  Trash: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  AlertCircle: () => (
    <svg className="h-6 w-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Spinner: () => (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
};

function Field({ label, suffix, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
      )}
      <div className="relative flex items-center">
        <input
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 hover:bg-white focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
          inputMode="decimal"
          {...props}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 text-xs font-semibold text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function RequiredFinal() {
  const [rows, setRows] = useState([
    { name: 'Chuyên cần', weight: '10', score: '' },
    { name: 'Giữa kỳ', weight: '30', score: '' },
  ]);
  const [finalWeight, setFinalWeight] = useState('60');
  const [target, setTarget] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const setRow = (i, field, value) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [field]: value.replace(',', '.') } : r)));

  const removeRow = (i) => {
    if (rows.length > 1) {
      setRows((rs) => rs.filter((_, idx) => idx !== i));
    }
  };

  // Tính tổng trọng số theo thời gian thực để hỗ trợ UX
  const totalWeight = useMemo(() => {
    const componentSum = rows.reduce((sum, r) => sum + (parseFloat(r.weight) || 0), 0);
    return Math.round((componentSum + (parseFloat(finalWeight) || 0)) * 100) / 100;
  }, [rows, finalWeight]);

  const isWeightValid = totalWeight === 100;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const components = [...rows, { name: 'Cuối kỳ', weight: finalWeight, score: null }];
      setResult(await api('/gpa/required-final', { method: 'POST', body: { components, target } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8"
    >
      <div className="space-y-6">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-500/10">
              <Icons.Calculator />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Điểm thi cuối kỳ cần đạt
              </h2>
              <p className="text-sm text-slate-500">
                Tính điểm tối thiểu bài thi cuối kỳ để đạt mục tiêu môn học.
              </p>
            </div>
          </div>
        </div>

        {/* Thanh trạng thái tổng trọng số */}
        <div className="rounded-xl bg-slate-50 p-3.5 ring-1 ring-inset ring-slate-200/60">
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">Tổng trọng số hiện tại</span>
            <span className={isWeightValid ? 'text-emerald-600' : 'text-amber-600'}>
              {totalWeight}% / 100%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full transition-all duration-300 ${
                isWeightValid
                  ? 'bg-emerald-500'
                  : totalWeight > 100
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(totalWeight, 100)}%` }}
            />
          </div>
        </div>

        {/* Danh sách điểm thành phần */}
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_5.5rem_5.5rem_2rem] gap-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Thành phần</span>
            <span>Trọng số</span>
            <span>Điểm</span>
            <span />
          </div>

          {rows.map((r, i) => (
            <div key={i} className="group grid grid-cols-[1fr_5.5rem_5.5rem_2rem] items-center gap-2">
              <Field
                aria-label={`Tên thành phần ${i + 1}`}
                inputMode="text"
                placeholder="VD: Tiểu luận"
                value={r.name}
                onChange={(e) => setRow(i, 'name', e.target.value)}
              />
              <Field
                aria-label={`Trọng số thành phần ${i + 1}`}
                suffix="%"
                placeholder="20"
                value={r.weight}
                onChange={(e) => setRow(i, 'weight', e.target.value)}
              />
              <Field
                aria-label={`Điểm thành phần ${i + 1}`}
                suffix="/10"
                placeholder="8.5"
                value={r.score}
                onChange={(e) => setRow(i, 'score', e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                disabled={rows.length <= 1}
                aria-label="Xóa thành phần"
                className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:pointer-events-none disabled:opacity-20"
              >
                <Icons.Trash />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, { name: '', weight: '', score: '' }])}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            <Icons.Plus />
            Thêm điểm thành phần
          </button>
        </div>

        {/* Khu vực thiết lập mục tiêu cuối kỳ */}
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
          <Field
            label="Trọng số cuối kỳ"
            suffix="%"
            value={finalWeight}
            onChange={(e) => setFinalWeight(e.target.value.replace(',', '.'))}
          />
          <Field
            label="Điểm tổng kết mục tiêu"
            suffix="/10"
            placeholder="8.0"
            value={target}
            onChange={(e) => setTarget(e.target.value.replace(',', '.'))}
          />
        </div>
      </div>

      {/* Footer & Result */}
      <div className="mt-6 space-y-4 pt-2">
        <button
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && <Icons.Spinner />}
          {busy ? 'Đang phân tích dữ liệu...' : 'Tính điểm cần đạt'}
        </button>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          >
            <Icons.AlertCircle />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div
            role="status"
            className={`rounded-xl border p-4 transition-all ${
              result.alreadyReached || result.achievable
                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                : 'border-rose-200 bg-rose-50/70 text-rose-950'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {result.alreadyReached || result.achievable ? (
                  <Icons.CheckCircle />
                ) : (
                  <Icons.AlertCircle />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                  {result.alreadyReached
                    ? 'Đã hoàn thành mục tiêu'
                    : result.achievable
                      ? 'Mục tiêu khả thi'
                      : 'Vượt ngưỡng tối đa'}
                </p>
                <p className="text-sm leading-relaxed">
                  {result.alreadyReached ? (
                    'Chúc mừng! Điểm tích lũy hiện tại đã đủ đạt mục tiêu bất kể kết quả thi cuối kỳ.'
                  ) : result.achievable ? (
                    <>
                      Bạn cần đạt tối thiểu{' '}
                      <span className="mx-1 inline-block rounded-md bg-emerald-600 px-2 py-0.5 text-base font-extrabold text-white shadow-sm">
                        {result.required}
                      </span>{' '}
                      điểm ở bài thi cuối kỳ.
                    </>
                  ) : (
                    <>
                      Bạn cần tới <strong className="font-bold text-rose-700">{result.required}</strong>{' '}
                      điểm (vượt thang 10). Hãy thử điều chỉnh mức điểm mục tiêu phù hợp hơn.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}

function ExpectedGpa() {
  const [f, setF] = useState({
    currentGpa: '',
    currentCredits: '',
    remainingCredits: '',
    targetGpa: '',
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value.replace(',', '.') }));

  // Tính tổng tín chỉ toàn khóa để hiển thị thông tin phụ trợ
  const totalCredits = useMemo(() => {
    const cur = parseFloat(f.currentCredits) || 0;
    const rem = parseFloat(f.remainingCredits) || 0;
    return cur + rem;
  }, [f.currentCredits, f.remainingCredits]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);
    try {
      setResult(await api('/gpa/expected', { method: 'POST', body: f }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8"
    >
      <div className="space-y-6">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-inset ring-teal-500/10">
              <Icons.Target />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Dự phóng GPA tích lũy
              </h2>
              <p className="text-sm text-slate-500">
                Xác định điểm trung bình (hệ 4) cần duy trì cho các tín chỉ còn lại.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Badge */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-xs ring-1 ring-inset ring-slate-200/60">
          <span className="font-medium text-slate-600">Tổng tín chỉ chương trình dự kiến</span>
          <span className="rounded-md bg-white px-2.5 py-1 font-bold text-slate-800 shadow-2xs ring-1 ring-slate-200/80">
            {totalCredits > 0 ? `${totalCredits} tín chỉ` : 'Chưa nhập'}
          </span>
        </div>

        {/* Grid Inputs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="GPA hiện tại"
            suffix="/ 4.0"
            placeholder="3.00"
            value={f.currentGpa}
            onChange={set('currentGpa')}
          />
          <Field
            label="Tín chỉ đã tích lũy"
            suffix="TC"
            placeholder="60"
            value={f.currentCredits}
            onChange={set('currentCredits')}
          />
          <Field
            label="Tín chỉ còn lại"
            suffix="TC"
            placeholder="60"
            value={f.remainingCredits}
            onChange={set('remainingCredits')}
          />
          <Field
            label="GPA mục tiêu tốt nghiệp"
            suffix="/ 4.0"
            placeholder="3.20"
            value={f.targetGpa}
            onChange={set('targetGpa')}
          />
        </div>

        {/* Gợi ý xếp loại học lực hệ 4 */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Tham chiếu xếp loại (Thang 4.0)
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-white p-2 ring-1 ring-slate-200/60">
              <div className="font-bold text-slate-800">2.50 – 3.19</div>
              <div className="text-[11px] text-slate-500">Khá</div>
            </div>
            <div className="rounded-lg bg-white p-2 ring-1 ring-slate-200/60">
              <div className="font-bold text-indigo-600">3.20 – 3.59</div>
              <div className="text-[11px] text-slate-500">Giỏi</div>
            </div>
            <div className="rounded-lg bg-white p-2 ring-1 ring-slate-200/60">
              <div className="font-bold text-emerald-600">3.60 – 4.00</div>
              <div className="text-[11px] text-slate-500">Xuất sắc</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Result */}
      <div className="mt-6 space-y-4 pt-2">
        <button
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && <Icons.Spinner />}
          {busy ? 'Đang tính toán lộ trình...' : 'Tính GPA cần đạt'}
        </button>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          >
            <Icons.AlertCircle />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div
            role="status"
            className={`rounded-xl border p-4 transition-all ${
              result.alreadyReached || result.achievable
                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                : 'border-rose-200 bg-rose-50/70 text-rose-950'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {result.alreadyReached || result.achievable ? (
                  <Icons.CheckCircle />
                ) : (
                  <Icons.AlertCircle />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                  {result.alreadyReached
                    ? 'Đã chạm ngưỡng mục tiêu'
                    : result.achievable
                      ? 'Lộ trình khả thi'
                      : 'Không khả thi'}
                </p>
                <p className="text-sm leading-relaxed">
                  {result.alreadyReached ? (
                    'Bạn đã đạt mức GPA mục tiêu, kể cả khi các tín chỉ còn lại chỉ đạt điểm qua môn tối thiểu.'
                  ) : result.achievable ? (
                    <>
                      Các tín chỉ còn lại cần đạt trung bình{' '}
                      <span className="mx-1 inline-block rounded-md bg-teal-600 px-2 py-0.5 text-base font-extrabold text-white shadow-sm">
                        {result.required}
                      </span>{' '}
                      trên thang điểm 4.0.
                    </>
                  ) : (
                    <>
                      Cần đạt trung bình{' '}
                      <strong className="font-bold text-rose-700">{result.required}</strong> / 4.0
                      (vượt mức tối đa). Hãy cân nhắc học cải thiện hoặc điều chỉnh mục tiêu.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}

export default function Tools() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 py-4">
      {/* Page Header */}
      <div className="space-y-2 border-b border-slate-200/80 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/15">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
          Academic Planner
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Công cụ hoạch định điểm số
        </h1>
        <p className="max-w-2xl text-base text-slate-500">
          Mô phỏng kịch bản điểm thi kết thúc học phần và lập kế hoạch GPA tích lũy để chủ động kiểm soát mục tiêu học tập.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        <RequiredFinal />
        <ExpectedGpa />
      </div>
    </div>
  );
}