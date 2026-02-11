/**
 * 认证相关类型定义
 */

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  can_edit: boolean;
  legacy_data_migrated: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface RegisterResponse {
  token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  full_name?: string;
  password?: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive';
  can_edit?: boolean;
}