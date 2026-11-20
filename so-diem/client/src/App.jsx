import { Link, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Tools from './pages/Tools.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ResultSheet from './components/ResultSheet.jsx';

export default function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="cong-cu" element={<Tools />} />
        <Route
          path="bang-diem-cua-toi"
          element={
            <ResultSheet
              user={user}
              authLoading={loading}
              defaultShowTranscript
            />
          }
        />
        <Route path="dang-nhap" element={<AuthPage />} />
        <Route path="so-diem" element={<Dashboard />} />
        <Route
          path="*"
          element={
            <div className="card space-y-3 text-center">
              <p>Không tìm thấy trang này. Quay về trang chủ để tiếp tục.</p>
              <Link to="/" className="btn-primary">
                Về trang tính GPA
              </Link>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}