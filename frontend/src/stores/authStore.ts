/**
 * Zustand 状态管理 - 认证状态存储
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/auth';
import type { AuthState } from '@/types/auth';

interface AuthStore extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, full_name?: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, _get) => ({
      // 初始状态
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 设置加载状态
      setLoading: (loading) => set({ isLoading: loading }),

      // 清除错误
      clearError: () => set({ error: null }),

      // 登录
      login: async (username: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.login({ username, password });

          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '登录失败',
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
          });
          throw error;
        }
      },

      // 注册
      register: async (username: string, email: string, password: string, full_name?: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.register({ username, email, password, full_name });

          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '注册失败',
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
          });
          throw error;
        }
      },

      // 登出
      logout: () => {
        authService.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // 加载用户信息
      loadUser: async () => {
        try {
          set({ isLoading: true, error: null });

          // 检查是否有token
          const token = authService.getToken();
          if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
          }

          // 获取用户信息
          const user = await authService.getCurrentUser();

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('加载用户信息失败:', error);

          // 清除无效的token
          authService.logout();

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: '会话已过期，请重新登录',
          });
        }
      },
    }),
    {
      name: 'auth-storage', // localStorage中的key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);