import { Route, Routes } from 'react-router';
import MainLayout from '@/layouts/MainLayout';
// import Chat from '@/pages/Chat';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { PublicRoute } from './PublicRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />} />
        {/* <Route path="/conversations" element={<Conversations />} /> */}
      </Route>

      {/* <Route path="/" element={<Navigate to="/chat" replace />} /> */}
    </Routes>
  );
};

export default AppRoutes;
