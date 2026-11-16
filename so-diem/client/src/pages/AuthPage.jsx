import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/so-diem" replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isLogin = mode === 'login';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate('/so-diem');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-extrabold">{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
      {!isLogin && (
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Tên hiển thị</span>
          <input className="field" value={form.name} onChange={set('name')} autoComplete="name" required />
        </label>
      )}
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Email</span>
        <input className="field" type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Mật khẩu {isLogin ? '' : '(ít nhất 8 ký tự)'}</span>
        <input
          className="field"
          type="password"
          value={form.password}
          onChange={set('password')}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          minLength={isLogin ? undefined : 8}
          required
        />
      </label>
      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? 'Đang xử lý…' : isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
      </button>
      <button
        type="button"
        className="w-full text-sm font-medium text-pine underline"
        onClick={() => {
          setMode(isLogin ? 'register' : 'login');
          setError('');
        }}
      >
        {isLogin ? 'Chưa có tài khoản? Tạo tài khoản' : 'Đã có tài khoản? Đăng nhập'}
      </button>
    </form>
  );
}
