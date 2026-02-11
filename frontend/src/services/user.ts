/**
 * 用户管理API服务
 */

import api from './api';
import type { User, CreateUserRequest, UpdateUserRequest } from '@/types/user';

export const userService = {
  // 获取所有用户（仅管理员）
  async getUsers(): Promise<User[]> {
    return await api.get<User[]>('/users');
  },

  // 获取单个用户信息
  async getUser(id: number): Promise<User> {
    return await api.get<User>(`/users/${id}`);
  },

  // 创建用户（仅管理员）
  async createUser(userData: CreateUserRequest): Promise<User> {
    return await api.post<User>('/users', userData);
  },

  // 更新用户信息
  async updateUser(id: number, updates: UpdateUserRequest): Promise<User> {
    return await api.put<User>(`/users/${id}`, updates);
  },

  // 删除用户（仅管理员）
  async deleteUser(id: number): Promise<{ success: boolean }> {
    return await api.delete<{ success: boolean }>(`/users/${id}`);
  },

  // 更新当前用户信息
  async updateCurrentUser(updates: UpdateUserRequest): Promise<User> {
    const currentUser = await api.get<User>('/auth/me');
    return await this.updateUser(currentUser.id, updates);
  },
};