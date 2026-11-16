import { useState } from 'react';
import { api } from '../api.js';

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <input className="field" inputMode="decimal" {...props} />
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
    <form onSubmit={submit} className="card space-y-4">
      <div>
        <h2 className="text-xl font-extrabold">Cuối kỳ cần bao nhiêu điểm?</h2>
        <p className="text-sm text-ink/70">Nhập điểm các phần đã có. Tổng trọng số phải bằng 100%.</p>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_5rem_5rem] items-end gap-2">
          <Field
            label={i === 0 ? 'Thành phần' : undefined}
            aria-label={`Tên thành phần ${i + 1}`}
            inputMode="text"
            value={r.name}
            onChange={(e) => setRow(i, 'name', e.target.value)}
          />
          <Field label={i === 0 ? 'Trọng số %' : undefined} aria-label={`Trọng số thành phần ${i + 1}`} value={r.weight} onChange={(e) => setRow(i, 'weight', e.target.value)} />
          <Field label={i === 0 ? 'Điểm /10' : undefined} aria-label={`Điểm thành phần ${i + 1}`} value={r.score} onChange={(e) => setRow(i, 'score', e.target.value)} />
        </div>
      ))}
      <button type="button" className="btn-ghost" onClick={() => setRows((rs) => [...rs, { name: '', weight: '', score: '' }])}>
        Thêm thành phần
      </button>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Trọng số thi cuối kỳ (%)" value={finalWeight} onChange={(e) => setFinalWeight(e.target.value)} />
        <Field label="Điểm tổng kết mong muốn" placeholder="8.0" value={target} onChange={(e) => setTarget(e.target.value.replace(',', '.'))} />
      </div>
      <button className="btn-primary" disabled={busy}>{busy ? 'Đang tính…' : 'Tính điểm cần đạt'}</button>
      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
      {result && (
        <p role="status" className="rounded bg-paper p-3 text-lg">
          {result.alreadyReached
            ? 'Bạn đã đạt mục tiêu dù thi cuối kỳ bao nhiêu điểm.'
            : result.achievable
              ? <>Bạn cần đạt ít nhất <span className="highlight font-extrabold">{result.required}</span> điểm ở bài thi cuối kỳ.</>
              : <>Cần {result.required} điểm, vượt thang 10 nên chưa thể đạt mục tiêu này. Hãy chọn mục tiêu thấp hơn.</>}
        </p>
      )}
    </form>
  );
}

function ExpectedGpa() {
  const [f, setF] = useState({ currentGpa: '', currentCredits: '', remainingCredits: '', targetGpa: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value.replace(',', '.') }));

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
    <form onSubmit={submit} className="card space-y-4">
      <div>
        <h2 className="text-xl font-extrabold">GPA kỳ vọng</h2>
        <p className="text-sm text-ink/70">Xem GPA trung bình (thang 4) cần đạt ở các tín chỉ còn lại.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="GPA hiện tại" placeholder="3.00" value={f.currentGpa} onChange={set('currentGpa')} />
        <Field label="Tín chỉ đã học" placeholder="60" value={f.currentCredits} onChange={set('currentCredits')} />
        <Field label="Tín chỉ còn lại" placeholder="60" value={f.remainingCredits} onChange={set('remainingCredits')} />
        <Field label="GPA mục tiêu" placeholder="3.20" value={f.targetGpa} onChange={set('targetGpa')} />
      </div>
      <button className="btn-primary" disabled={busy}>{busy ? 'Đang tính…' : 'Tính GPA cần đạt'}</button>
      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
      {result && (
        <p role="status" className="rounded bg-paper p-3 text-lg">
          {result.alreadyReached
            ? 'Bạn đã đạt mục tiêu, kể cả khi các tín chỉ còn lại đạt điểm thấp nhất.'
            : result.achievable
              ? <>Các tín chỉ còn lại cần trung bình <span className="highlight font-extrabold">{result.required}</span> trên thang 4.</>
              : <>Cần {result.required} trên thang 4, vượt mức tối đa nên chưa thể đạt mục tiêu này.</>}
        </p>
      )}
    </form>
  );
}

export default function Tools() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold">Công cụ tính điểm</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <RequiredFinal />
        <ExpectedGpa />
      </div>
    </div>
  );
}
