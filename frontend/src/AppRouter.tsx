/**
 * 应用路由组件 - 处理所有路由
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import Login from '@/components/Auth/Login';
import Register from '@/components/Auth/Register';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import MainApp from './App'; // 现有的App组件作为主应用
import UserManagement from '@/components/Admin/UserManagement';

export default function AppRouter() {
  const { loadUser } = useAuthStore();

  // 应用启动时加载用户信息
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 需要认证的路由 */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        }
      />

      {/* 需要管理员权限的路由 */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requireAdmin>
            <UserManagement />
          </ProtectedRoute>
        }
      />

      {/* 默认重定向 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}