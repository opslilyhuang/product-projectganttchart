
/**
 * 登录页面组件 - GPT/Gemini风格
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LogIn, Lock, User, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.password.trim()) {
      return;
    }

    try {
      await login(formData.username, formData.password);
      // 登录成功后会自动重定向（由useEffect处理）
    } catch (err) {
      // 错误已经在store中处理
      console.error('登录失败:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ai-background to-ai-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[480px] animate-ai-fade-in">
        {/* 品牌标识 */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-ai-primary to-ai-green rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-ai-elevation-4">
            <LogIn className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-ai-text-primary mb-3">
            AI 项目甘特图
          </h1>
          <p className="text-lg text-ai-text-secondary">
            智能项目管理与协作平台
          </p>
        </div>

        {/* 登录卡片 */}
        <div className="bg-ai-surface rounded-2xl shadow-ai-card p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 用户名/邮箱输入 */}
            <div className="space-y-3">
              <label htmlFor="username" className="block text-base font-medium text-ai-text-primary">
                用户名或邮箱
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
                  placeholder="输入用户名或邮箱地址"
                  required
                  className="pl-20"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div className="space-y-3">
              <label htmlFor="password" className="block text-base font-medium text-ai-text-primary">
                密码
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
                  placeholder="输入密码"
                  required
                  className="pl-20"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-ai-slide-up">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-base font-medium text-red-800">登录失败</p>
                  <p className="text-base text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* 登录按钮 */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full h-14 text-base"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    登录中...
                  </span>
                ) : (
                  '登录'
                )}
              </Button>
            </div>
          </form>

          {/* 注册链接 */}
          <div className="mt-10 pt-8 border-t border-ai-border text-center">
            <p className="text-base text-ai-text-secondary">
              还没有账户？{' '}
              <Link
                to="/register"
                className="font-medium text-ai-primary hover:text-blue-600 transition-colors"
              >
                创建新账户
              </Link>
            </p>
          </div>
        </div>

        {/* 演示账户信息 */}
        <div className="mt-8 p-5 bg-ai-gray-50 rounded-xl">
          <p className="text-sm font-medium text-ai-text-secondary mb-3">演示账户（只读权限）</p>
          <div className="text-sm text-ai-text-muted space-y-2">
            <p className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-5 h-5 bg-ai-success/20 text-ai-success rounded-full">
                👁️
              </span>
              <span className="font-mono">viewer / viewonly123</span>
            </p>
            <p className="text-ai-gray-500">此账户仅可查看项目，无法编辑任务</p>
          </div>
        </div>
      </div>
    </div>
  );
}