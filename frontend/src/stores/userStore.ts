/**
 * Zustand 状态管理 - 用户管理存储
 */

import { create } from 'zustand';
import { userService } from '@/services/user';
import type { User, UserStore } from '@/types/user';

interface ExtendedUserStore extends UserStore {
  fetchUsers: () => Promise<void>;
  createUser: (userData: any) => Promise<User>;
  updateUser: (id: number, updates: any) => Promise<User>;
  deleteUser: (id: number) => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  clearError: () => void;
}

export const useUserStore = create<ExtendedUserStore>((set, get) => ({
  // 初始状态
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,

  // 设置当前用户
  setCurrentUser: (user) => set({ currentUser: user }),

  // 清除错误
  clearError: () => set({ error: null }),

  // 获取所有用户
  fetchUsers: async () => {
    try {
      set({ isLoading: true, error: null });
      const users = await userService.getUsers();
      set({ users, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取用户列表失败',
        isLoading: false,
      });
      throw error;
    }
  },

  // 创建用户
  createUser: async (userData) => {
    try {
      set({ isLoading: true, error: null });
      const newUser = await userService.createUser(userData);

      // 更新用户列表
      const { users } = get();
      set({
        users: [newUser, ...users],
        isLoading: false,
      });

      return newUser;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '创建用户失败',
        isLoading: false,
      });
      throw error;
    }
  },

  // 更新用户
  updateUser: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      const updatedUser = await userService.updateUser(id, updates);

      // 更新用户列表
      const { users, currentUser } = get();
      const updatedUsers = users.map(user =>
        user.id === id ? updatedUser : user
      );

      set({
        users: updatedUsers,
        currentUser: currentUser?.id === id ? updatedUser : currentUser,
        isLoading: false,
      });

      return updatedUser;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新用户失败',
        isLoading: false,
      });
      throw error;
    }
  },

  // 删除用户
  deleteUser: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await userService.deleteUser(id);

      // 更新用户列表
      const { users, currentUser } = get();
      const filteredUsers = users.filter(user => user.id !== id);

      set({
        users: filteredUsers,
        currentUser: currentUser?.id === id ? null : currentUser,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除用户失败',
        isLoading: false,
      });
      throw error;
    }
  },
}));