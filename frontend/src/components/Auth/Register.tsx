/**
 * 注册页面组件
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { UserPlus, Mail, Lock, User, AlertCircle, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
  });

  const [passwordError, setPasswordError] = useState('');

  // 如果已经登录，重定向到首页
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // 清除错误
    if (error) clearError();

    // 检查密码匹配
    if (name === 'password' || name === 'confirmPassword') {
      if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
        setPasswordError('两次输入的密码不一致');
      } else {
        setPasswordError('');
      }
    }
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      return '请输入用户名';
    }
    if (!formData.email.trim()) {
      return '请输入邮箱';
    }
    if (!formData.password.trim()) {
      return '请输入密码';
    }
    if (formData.password.length < 6) {
      return '密码长度至少6位';
    }
    if (formData.password !== formData.confirmPassword) {
      return '两次输入的密码不一致';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    try {
      await register(
        formData.username,
        formData.email,
        formData.password,
        formData.full_name || undefined
      );
      // 注册成功后会自动重定向（由useEffect处理）
    } catch (err) {
      // 错误已经在store中处理
      console.error('注册失败:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">创建新账户</h1>
          <p className="text-gray-600">加入AI项目甘特图管理系统</p>
        </div>

        {/* 注册卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 用户名输入 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                用户名 *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="请输入用户名"
                  required
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 邮箱输入 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱 *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="请输入邮箱"
                  required
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 姓名输入 */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                姓名（可选）
              </label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="请输入您的姓名"
                className="w-full"
                disabled={isLoading}
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码 *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="至少6位字符"
                  required
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              {formData.password.length >= 6 && (
                <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                  <Check className="w-3 h-3" />
                  <span>密码强度足够</span>
                </div>
              )}
            </div>

            {/* 确认密码输入 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                确认密码 *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="请再次输入密码"
                  required
                  className="pl-10"
                  disabled={isLoading}
                  error={!!passwordError}
                />
              </div>
              {passwordError && (
                <p className="mt-1 text-xs text-red-600">{passwordError}</p>
              )}
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* 注册按钮 */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700"
              loading={isLoading}
              disabled={isLoading || !!passwordError}
            >
              {isLoading ? '注册中...' : '注册'}
            </Button>

            {/* 条款说明 */}
            <div className="text-xs text-gray-500">
              <p>点击"注册"即表示您同意我们的服务条款和隐私政策。</p>
              <p className="mt-1">新注册用户默认为普通用户，具有编辑权限。</p>
            </div>
          </form>

          {/* 登录链接 */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              已有账户？{' '}
              <Link
                to="/login"
                className="font-medium text-green-600 hover:text-green-500 transition-colors"
              >
                立即登录
              </Link>
            </p>
          </div>
        </div>

        {/* 页脚 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">© 2026 中源生物企业 AI 业务与决策系统</p>
          <p className="text-xs text-gray-400 mt-1">React + TypeScript + DHTMLX Gantt + Zustand</p>
        </div>
      </div>
    </div>
  );
}