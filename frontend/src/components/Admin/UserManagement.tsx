/**
 * 用户管理界面组件（仅管理员）
 */

import { useState, useEffect } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/authStore';
import {
  Users, UserPlus, Edit, Trash2, Check, X, Shield,
  UserCheck, UserX, Lock, Unlock, AlertCircle, Search
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

export default function UserManagement() {
  const { users, isLoading, error, fetchUsers, createUser, updateUser, deleteUser } = useUserStore();
  const { user: currentUser } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<any>(null);

  const [newUserData, setNewUserData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'user' as 'admin' | 'user',
    status: 'active' as 'active' | 'inactive',
    can_edit: true,
  });

  // 加载用户列表
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 过滤用户
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  const handleCreateUser = async () => {
    try {
      await createUser(newUserData);
      setIsCreateModalOpen(false);
      setNewUserData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'user',
        status: 'active',
        can_edit: true,
      });
    } catch (err) {
      console.error('创建用户失败:', err);
    }
  };

  const handleUpdateUser = async (id: number, updates: any) => {
    try {
      await updateUser(id, updates);
      setEditingUser(null);
    } catch (err) {
      console.error('更新用户失败:', err);
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await deleteUser(id);
      setDeleteConfirmUser(null);
    } catch (err) {
      console.error('删除用户失败:', err);
    }
  };

  const handleToggleStatus = (user: any) => {
    handleUpdateUser(user.id, {
      status: user.status === 'active' ? 'inactive' : 'active'
    });
  };

  const handleToggleEditPermission = (user: any) => {
    handleUpdateUser(user.id, {
      can_edit: !user.can_edit
    });
  };

  const handleChangeRole = (user: any, role: 'admin' | 'user') => {
    handleUpdateUser(user.id, { role });
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载用户列表中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 头部 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              用户管理
            </h1>
            <p className="text-gray-600 mt-1">管理系统的所有用户账户和权限</p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="primary"
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            添加用户
          </Button>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="search"
            placeholder="搜索用户（用户名、邮箱、姓名）..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 用户列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  编辑权限
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  {/* 用户信息 */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          user.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
                        }`}>
                          {user.role === 'admin' ? (
                            <Shield className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Users className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{user.username}</span>
                            {user.id === currentUser?.id && (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                当前用户
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                            {user.full_name && ` • ${user.full_name}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 角色 */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? '管理员' : '普通用户'}
                      </span>
                      {currentUser?.role === 'admin' && user.id !== currentUser.id && (
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user, e.target.value as 'admin' | 'user')}
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value="user">普通用户</option>
                          <option value="admin">管理员</option>
                        </select>
                      )}
                    </div>
                  </td>

                  {/* 状态 */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={user.id === currentUser?.id}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } ${user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {user.status === 'active' ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            活跃
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3" />
                            禁用
                          </>
                        )}
                      </button>
                    </div>
                  </td>

                  {/* 编辑权限 */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleEditPermission(user)}
                      disabled={user.id === currentUser?.id}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                        user.can_edit
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      } ${user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {user.can_edit ? (
                        <>
                          <Unlock className="w-3 h-3" />
                          可编辑
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          只读
                        </>
                      )}
                    </button>
                  </td>

                  {/* 创建时间 */}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('zh-CN')}
                  </td>

                  {/* 操作 */}
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmUser(user)}
                        disabled={user.id === currentUser?.id}
                        className={`p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded ${
                          user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 空状态 */}
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? '没有找到匹配的用户' : '还没有用户'}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? '尝试不同的搜索词或清除搜索框'
                  : '点击"添加用户"按钮创建第一个用户'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  variant="primary"
                  className="flex items-center gap-2 mx-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  添加用户
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 创建用户模态框 */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="添加新用户"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名 *
              </label>
              <Input
                value={newUserData.username}
                onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                placeholder="请输入用户名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邮箱 *
              </label>
              <Input
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                placeholder="请输入邮箱"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码 *
              </label>
              <Input
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                placeholder="至少6位字符"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                姓名（可选）
              </label>
              <Input
                value={newUserData.full_name}
                onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                placeholder="请输入姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                角色
              </label>
              <select
                value={newUserData.role}
                onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as 'admin' | 'user' })}
                className="w-full px-4 h-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              >
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                状态
              </label>
              <select
                value={newUserData.status}
                onChange={(e) => setNewUserData({ ...newUserData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-4 h-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              >
                <option value="active">活跃</option>
                <option value="inactive">禁用</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="can_edit"
              checked={newUserData.can_edit}
              onChange={(e) => setNewUserData({ ...newUserData, can_edit: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="can_edit" className="text-sm text-gray-700">
              允许编辑任务
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={() => setIsCreateModalOpen(false)}
              variant="outline"
            >
              取消
            </Button>
            <Button
              onClick={handleCreateUser}
              variant="primary"
              disabled={!newUserData.username || !newUserData.email || !newUserData.password}
            >
              创建用户
            </Button>
          </div>
        </div>
      </Modal>

      {/* 编辑用户模态框 */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="编辑用户"
        maxWidth="lg"
      >
        {editingUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <Input
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  邮箱
                </label>
                <Input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码（留空不修改）
                </label>
                <Input
                  type="password"
                  value={editingUser.password || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  placeholder="留空不修改密码"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  姓名
                </label>
                <Input
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                onClick={() => setEditingUser(null)}
                variant="outline"
              >
                取消
              </Button>
              <Button
                onClick={() => handleUpdateUser(editingUser.id, {
                  username: editingUser.username,
                  email: editingUser.email,
                  password: editingUser.password || undefined,
                  full_name: editingUser.full_name || undefined,
                })}
                variant="primary"
              >
                保存更改
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 删除确认模态框 */}
      <Modal
        isOpen={!!deleteConfirmUser}
        onClose={() => setDeleteConfirmUser(null)}
        title="确认删除"
        maxWidth="md"
      >
        {deleteConfirmUser && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-800">警告：此操作不可撤销</h4>
                  <p className="text-sm text-red-700 mt-1">
                    您确定要删除用户 "{deleteConfirmUser.username}" 吗？此操作将永久删除该用户的所有数据。
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setDeleteConfirmUser(null)}
                variant="outline"
              >
                取消
              </Button>
              <Button
                onClick={() => handleDeleteUser(deleteConfirmUser.id)}
                variant="danger"
              >
                确认删除
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}