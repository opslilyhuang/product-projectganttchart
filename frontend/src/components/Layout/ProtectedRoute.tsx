/**
 * 路由守卫组件 - 保护需要认证的路由
 */

import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireEditPermission?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireEditPermission = false
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, user, loadUser } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // 如果store中没有用户信息，尝试加载
      if (!user && !isLoading) {
        await loadUser();
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [user, isLoading, loadUser]);

  // 显示加载状态
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 检查是否已认证
  if (!isAuthenticated) {
    // 重定向到登录页，并保存当前路径以便登录后返回
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 检查管理员权限
  if (requireAdmin && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">权限不足</h2>
          <p className="text-gray-600 mb-6">
            此功能需要管理员权限。您的当前角色是 <span className="font-medium">{user?.role}</span>。
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    );
  }

  // 检查编辑权限
  if (requireEditPermission && !user?.can_edit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">只读模式</h2>
          <p className="text-gray-600 mb-6">
            您的账户当前处于只读模式。请联系管理员获取编辑权限。
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    );
  }

  // 通过所有检查，渲染子组件
  return <>{children}</>;
}