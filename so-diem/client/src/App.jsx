import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Tools from './pages/Tools.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AuthPage from './pages/AuthPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="cong-cu" element={<Tools />} />
        <Route path="so-diem" element={<Dashboard />} />
        <Route path="dang-nhap" element={<AuthPage />} />
        <Route
          path="*"
          element={<p className="card">Không tìm thấy trang này. Quay về trang chủ để tiếp tục.</p>}
        />
      </Route>
    </Routes>
  );
}
