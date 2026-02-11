/**
 * 认证相关API服务
 */

import api from './api';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from '@/types/auth';

export const authService = {
  // 登录
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);

    // 保存token到localStorage
    if (response.token) {
      localStorage.setItem('token', response.token);
    }

    return response;
  },

  // 注册
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', userData);

    // 保存token到localStorage
    if (response.token) {
      localStorage.setItem('token', response.token);
    }

    return response;
  },

  // 获取当前用户信息
  async getCurrentUser(): Promise<User> {
    return await api.get<User>('/auth/me');
  },

  // 登出
  logout(): void {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  // 检查是否已登录
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  // 获取token
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  // 设置token（用于从其他地方设置token）
  setToken(token: string): void {
    localStorage.setItem('token', token);
  },
};