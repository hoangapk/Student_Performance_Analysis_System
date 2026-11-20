import { Link, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Tools from './pages/Tools.jsx';
import StudyCharts from './pages/StudyCharts.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="cong-cu" element={<Tools />} />
        <Route path="bieu-do-hoc-tap" element={<StudyCharts />} />
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