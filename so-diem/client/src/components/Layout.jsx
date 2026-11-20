import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

const navClass = ({ isActive }) =>
  `rounded px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-ink text-white' : 'text-ink hover:bg-white'}`;

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-rule bg-white/90">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="text-lg font-extrabold tracking-tight">
            Sổ Điểm
          </Link>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Điều hướng chính">
            <NavLink to="/" end className={navClass}>Tính GPA</NavLink>
            <NavLink to="/cong-cu" className={navClass}>Công cụ</NavLink>
            <NavLink to="/bieu-do-hoc-tap" className={navClass}>Biểu đồ học tập</NavLink>
            {user ? (
              <button type="button" onClick={logout} className="btn-ghost ml-2 !py-1.5">
                Đăng xuất
              </button>
            ) : (
              <Link to="/dang-nhap" className="btn-primary ml-2 !py-1.5">Đăng nhập</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">
        <Outlet />
      </main>
      <footer className="border-t border-rule bg-white/90 px-4 py-4 text-center text-sm text-ink/70">
        Kết quả mang tính tham khảo. Hãy đối chiếu với quy chế đào tạo của trường bạn.
      </footer>
    </div>
  );
}
