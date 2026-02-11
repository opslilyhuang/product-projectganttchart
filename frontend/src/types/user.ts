/**
 * 用户管理相关类型定义
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
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive';
  can_edit?: boolean;
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

export interface UserListResponse {
  users: User[];
  total: number;
}

export interface UserStore {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}