/**
 * 资源管理组件
 */

import { useState } from 'react';
import { Users, UserPlus, Calendar, BarChart3, Trash2, Edit, Check, X } from 'lucide-react';
import type { Resource, ResourceAssignment, GanttTask } from '@/types/gantt';

// 临时接口，稍后从store中获取
interface ResourceManagerProps {
  tasks: GanttTask[];
}

export default function ResourceManager({ tasks: _tasks }: ResourceManagerProps) {
  const [resources, setResources] = useState<Resource[]>([
    { id: 1, name: '张三', email: 'zhangsan@example.com', role: '开发工程师', capacity: 1.0 },
    { id: 2, name: '李四', email: 'lisi@example.com', role: '产品经理', capacity: 0.8 },
    { id: 3, name: '王五', email: 'wangwu@example.com', role: '设计师', capacity: 0.6 },
  ]);

  const [assignments, setAssignments] = useState<ResourceAssignment[]>([
    { id: 1, task_id: 'task-1', resource_id: 1, allocation: 0.5 },
    { id: 2, task_id: 'task-2', resource_id: 2, allocation: 0.8 },
  ]);

  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [newResource, setNewResource] = useState<Partial<Resource>>({
    name: '',
    email: '',
    role: '',
    capacity: 1.0,
  });

  const [showResourceForm, setShowResourceForm] = useState(false);

  // 处理添加/更新资源
  const handleSaveResource = () => {
    if (!newResource.name?.trim()) {
      alert('请输入资源名称');
      return;
    }

    if (editingResource) {
      // 更新现有资源
      setResources(resources.map(r =>
        r.id === editingResource.id
          ? { ...r, ...newResource, id: r.id }
          : r
      ));
      setEditingResource(null);
    } else {
      // 添加新资源
      const newId = Math.max(0, ...resources.map(r => r.id)) + 1;
      setResources([...resources, {
        id: newId,
        name: newResource.name!,
        email: newResource.email || '',
        role: newResource.role || '',
        capacity: newResource.capacity || 1.0,
      }]);
    }

    // 重置表单
    setNewResource({
      name: '',
      email: '',
      role: '',
      capacity: 1.0,
    });
    setShowResourceForm(false);
  };

  // 处理删除资源
  const handleDeleteResource = (id: number) => {
    if (confirm('确定要删除这个资源吗？相关的分配也将被删除。')) {
      setResources(resources.filter(r => r.id !== id));
      setAssignments(assignments.filter(a => a.resource_id !== id));
    }
  };

  // 处理编辑资源
  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setNewResource({
      name: resource.name,
      email: resource.email || '',
      role: resource.role || '',
      capacity: resource.capacity,
    });
    setShowResourceForm(true);
  };

  // 计算资源工作负载
  const calculateResourceWorkload = (resourceId: number) => {
    const resourceAssignments = assignments.filter(a => a.resource_id === resourceId);
    const totalAllocation = resourceAssignments.reduce((sum, a) => sum + a.allocation, 0);
    const resource = resources.find(r => r.id === resourceId);
    const capacity = resource?.capacity || 1.0;

    return {
      totalAllocation,
      capacity,
      overloaded: totalAllocation > capacity,
      utilization: Math.min(totalAllocation / capacity, 1) * 100,
    };
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">资源分配管理</h2>
        </div>
        <button
          onClick={() => setShowResourceForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          添加资源
        </button>
      </div>

      {/* 资源表单 */}
      {showResourceForm && (
        <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-800">
              {editingResource ? '编辑资源' : '添加新资源'}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleSaveResource}
                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Check className="w-4 h-4" />
                保存
              </button>
              <button
                onClick={() => {
                  setShowResourceForm(false);
                  setEditingResource(null);
                  setNewResource({
                    name: '',
                    email: '',
                    role: '',
                    capacity: 1.0,
                  });
                }}
                className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                <X className="w-4 h-4" />
                取消
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newResource.name}
                onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="输入资源姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <input
                type="email"
                value={newResource.email}
                onChange={(e) => setNewResource({ ...newResource, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="输入邮箱地址"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                角色
              </label>
              <input
                type="text"
                value={newResource.role}
                onChange={(e) => setNewResource({ ...newResource, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="如：开发工程师、产品经理"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                工作能力 <span className="text-gray-500">({(newResource.capacity || 1.0) * 100}%)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={newResource.capacity || 1.0}
                  onChange={(e) => setNewResource({ ...newResource, capacity: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">
                  {Math.round(newResource.capacity! * 100)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                1.0 = 全职，0.5 = 兼职，1.5 = 加班
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 资源列表 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">姓名</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">角色</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">邮箱</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">能力</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">工作负载</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">状态</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => {
              const workload = calculateResourceWorkload(resource.id);
              return (
                <tr key={resource.id} className="border-b border-gray-100 hover:bg-gray-50 h-14">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-800">{resource.name}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      {resource.role || '未指定'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{resource.email || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${resource.capacity * 50}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round(resource.capacity * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${Math.min(workload.utilization, 100)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${workload.overloaded ? 'text-red-600' : 'text-gray-700'}`}>
                        {Math.round(workload.utilization)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {workload.totalAllocation.toFixed(1)} / {resource.capacity.toFixed(1)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      workload.overloaded
                        ? 'bg-red-100 text-red-800'
                        : workload.utilization > 80
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {workload.overloaded ? '过载' : workload.utilization > 80 ? '繁忙' : '正常'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditResource(resource)}
                        className="w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-800 hover:bg-gray-100 rounded-lg"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteResource(resource.id)}
                        className="w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-800 hover:bg-gray-100 rounded-lg"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 资源分配统计 */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-800">资源总数</h3>
          </div>
          <div className="text-2xl font-bold text-gray-700">{resources.length}</div>
          <div className="text-sm text-gray-500">名成员</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-800">平均利用率</h3>
          </div>
          <div className="text-2xl font-bold text-gray-700">
            {Math.round(
              resources.reduce((sum, r) => {
                const workload = calculateResourceWorkload(r.id);
                return sum + workload.utilization;
              }, 0) / Math.max(resources.length, 1)
            )}%
          </div>
          <div className="text-sm text-gray-500">整体资源使用率</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-800">过载资源</h3>
          </div>
          <div className="text-2xl font-bold text-gray-700">
            {resources.filter(r => calculateResourceWorkload(r.id).overloaded).length}
          </div>
          <div className="text-sm text-gray-500">需要调整分配</div>
        </div>
      </div>

      {/* 资源分配说明 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-800 mb-2">使用说明</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 点击"添加资源"按钮创建新资源（团队成员）</li>
          <li>• 工作能力表示该资源可投入的时间比例（1.0 = 全职）</li>
          <li>• 工作负载超过100%表示资源过载，需要调整任务分配</li>
          <li>• 后续版本将支持在任务编辑器中直接分配资源</li>
        </ul>
      </div>
    </div>
  );
}