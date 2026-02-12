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
    <div className="min-h-screen bg-gradient-to-b from-ai-background to-ai-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[480px] animate-ai-fade-in">
        {/* 品牌标识 */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-ai-primary to-ai-green rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-ai-elevation-4">
            <UserPlus className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-ai-text-primary mb-3">
            创建新账户
          </h1>
          <p className="text-lg text-ai-text-secondary">
            加入AI项目甘特图管理系统
          </p>
        </div>

        {/* 注册卡片 */}
        <div className="bg-ai-surface rounded-2xl shadow-ai-card p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 用户名输入 */}
            <div className="space-y-3">
              <label htmlFor="username" className="block text-base font-medium text-ai-text-primary">
                用户名 *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-ai-gray-400" />
                </div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="输入用户名"
                  required
                  className="pl-20"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* 邮箱输入 */}
            <div className="space-y-3">
              <label htmlFor="email" className="block text-base font-medium text-ai-text-primary">
                邮箱 *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-ai-gray-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="输入邮箱地址"
                  required
                  className="pl-20"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* 姓名输入 */}
            <div className="space-y-3">
              <label htmlFor="full_name" className="block text-base font-medium text-ai-text-primary">
                姓名（可选）
              </label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="输入您的姓名"
                className="w-full"
                disabled={isLoading}
                autoComplete="name"
              />
            </div>

            {/* 密码输入 */}
            <div className="space-y-3">
              <label htmlFor="password" className="block text-base font-medium text-ai-text-primary">
                密码 *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-ai-gray-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="至少6位字符"
                  required
                  className="pl-20"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
              {formData.password.length >= 6 && (
                <div className="mt-2 flex items-center gap-2 text-sm text-ai-success">
                  <Check className="w-4 h-4" />
                  <span>密码强度足够</span>
                </div>
              )}
            </div>

            {/* 确认密码输入 */}
            <div className="space-y-3">
              <label htmlFor="confirmPassword" className="block text-base font-medium text-ai-text-primary">
                确认密码 *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-ai-gray-400" />
                </div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="再次输入密码"
                  required
                  className="pl-20"
                  disabled={isLoading}
                  error={!!passwordError}
                  autoComplete="new-password"
                />
              </div>
              {passwordError && (
                <p className="mt-2 text-sm text-ai-error">{passwordError}</p>
              )}
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-ai-slide-up">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-base font-medium text-red-800">注册失败</p>
                  <p className="text-base text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* 注册按钮 */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full h-14 text-base"
                loading={isLoading}
                disabled={isLoading || !!passwordError}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    注册中...
                  </span>
                ) : (
                  '创建账户'
                )}
              </Button>
            </div>

            {/* 条款说明 */}
            <div className="text-sm text-ai-text-muted pt-4">
              <p>点击"创建账户"即表示您同意我们的服务条款和隐私政策。</p>
              <p className="mt-2">新注册用户默认为普通用户，具有编辑权限。</p>
            </div>
          </form>

          {/* 登录链接 */}
          <div className="mt-10 pt-8 border-t border-ai-border text-center">
            <p className="text-base text-ai-text-secondary">
              已有账户？{' '}
              <Link
                to="/login"
                className="font-medium text-ai-primary hover:text-blue-600 transition-colors"
              >
                返回登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}