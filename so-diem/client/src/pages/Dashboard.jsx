import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import AnalysisCard from '../components/AnalysisCard.jsx';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [semesters, setSemesters] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setSemesters((await api('/semesters')).semesters);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading) return <p>Đang tải…</p>;
  if (!user) return <Navigate to="/dang-nhap" replace />;

  const analyze = async () => {
    setBusy(true);
    setError('');
    try {
      setAnalysis(await api('/analysis', { method: 'POST' }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Xóa học kỳ "${name}"? Không thể hoàn tác.`)) return;
    try {
      await api(`/semesters/${id}`, { method: 'DELETE' });
      setAnalysis(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const chart = semesters.map((s) => ({ name: s.name, gpa4: s.gpa4 }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Sổ điểm của {user.name}</h1>
          <p className="text-ink/70">Các học kỳ bạn đã lưu và xu hướng GPA.</p>
        </div>
        <button className="btn-primary" onClick={analyze} disabled={busy || semesters.length === 0}>
          {busy ? 'AI đang phân tích…' : 'Phân tích toàn bộ bằng AI'}
        </button>
      </div>

      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}

      {semesters.length === 0 ? (
        <div className="card">
          <p>Bạn chưa lưu học kỳ nào. Nhập điểm ở trang <Link className="font-semibold text-pine underline" to="/">Tính GPA</Link> rồi bấm "Lưu học kỳ".</p>
        </div>
      ) : (
        <>
          <section className="card" aria-label="Biểu đồ GPA theo học kỳ">
            <h2 className="mb-3 text-lg font-extrabold">GPA theo học kỳ (thang 4)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke="#D3DEEA" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="gpa4" name="GPA" stroke="#0E6F7E" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card" aria-label="Danh sách học kỳ">
            <ul className="divide-y divide-rule">
              {semesters.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-sm text-ink/70">
                      {s.courses.length} môn · {s.totalCredits} tín chỉ · {s.classification}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-extrabold">{s.gpa4.toFixed(2)}<span className="text-sm font-medium text-ink/70"> / 4</span></p>
                    <button className="btn-ghost !py-1" onClick={() => remove(s.id, s.name)}>Xóa</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {analysis && <AnalysisCard result={analysis} />}
    </div>
  );
}
