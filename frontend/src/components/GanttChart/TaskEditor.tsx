/**
 * 任务编辑器组件 - 美化版
 */

import { useState, useEffect } from 'react';
import { useGanttStore } from '@/stores/ganttStore';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import Select from '@/components/ui/Select';
import { Calendar, User, Target, Flag, AlertCircle, FileText, Settings, Link as LinkIcon, Trash2 } from 'lucide-react';
import type { GanttTask } from '@/types/gantt';

interface TaskEditorProps {
  task?: GanttTask | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskEditor({ task, isOpen, onClose }: TaskEditorProps) {
  const { addTask, updateTask, tasks, links, addLink, deleteLink, activeView } = useGanttStore();

  const [formData, setFormData] = useState<Partial<GanttTask>>({
    text: '',
    type: 'task',
    parent: null,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    owner: '',
    progress: 0,
    is_milestone: false,
    phase: 'H1',
    priority: 'medium',
    status: 'planned',
    description: '',
    view: activeView, // 默认使用当前活动视图
  });

  useEffect(() => {
    if (task) {
      setFormData(task);
    } else {
      setFormData({
        text: '',
        type: 'task',
        parent: null,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        owner: '',
        progress: 0,
        is_milestone: false,
        phase: 'H1',
        priority: 'medium',
        status: 'planned',
        description: '',
        view: activeView, // 新任务使用当前活动视图
      });
    }
  }, [task, activeView]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log('TaskEditor - handleSubmit called');
    console.log('Task ID:', task?.id);
    console.log('Form data before save:', formData);

    // 计算duration（天数）
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      formData.duration = durationDays > 0 ? durationDays : 1;
      console.log('Calculated duration:', formData.duration);
    }

    if (task) {
      console.log('Updating task:', task.id, formData);
      updateTask(task.id, formData);
    } else {
      console.log('Adding new task:', formData);
      // 确保view字段存在，如果没有则使用activeView
      const taskData = {
        ...formData,
        view: formData.view || activeView,
      } as Omit<GanttTask, 'id'>;
      addTask(taskData, taskData.view);
    }

    onClose();
  };

  const handleChange = (field: keyof GanttTask, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const availableParents = tasks.filter((t) => t.type === 'project');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? '✏️ 编辑任务' : '➕ 创建新任务'} maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息区域 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-700">基本信息</h3>
          </div>

          {/* 任务名称 */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Target className="w-4 h-4 text-blue-500" />
              任务名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.text}
              onChange={(e) => handleChange('text', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="输入任务名称..."
              required
            />
          </div>

          {/* 任务类型、父任务和视图 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Settings className="w-4 h-4 text-blue-500" />
                任务类型
              </label>
              <Select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-1"
              >
                <option value="project">📁 模块/项目</option>
                <option value="task">📋 任务</option>
                <option value="subtask">📌 子任务</option>
              </Select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Flag className="w-4 h-4 text-blue-500" />
                父任务
              </label>
              <Select
                value={formData.parent || ''}
                onChange={(e) => handleChange('parent', e.target.value || null)}
                disabled={formData.type === 'project'}
                className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-1"
              >
                <option value="">🔝 无（顶级任务）</option>
                {availableParents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    📁 {parent.text}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                📊 视图
              </label>
              <Select
                value={formData.view || activeView}
                onChange={(e) => handleChange('view', e.target.value)}
                className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-1"
              >
                <option value="project">🏢 项目甘特图</option>
                <option value="product">📦 产品甘特图</option>
              </Select>
            </div>
          </div>
        </div>

        {/* 时间安排区域 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-700">时间安排</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                📅 开始日期 <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={formData.start_date}
                onChange={(date) => handleChange('start_date', date)}
                required
                className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-1"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                📅 结束日期 <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={formData.end_date}
                onChange={(date) => handleChange('end_date', date)}
                required
                className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-1"
              />
            </div>
          </div>
        </div>

        {/* 责任与状态区域 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-700">责任与状态</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                👤 负责人
              </label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => handleChange('owner', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="输入负责人姓名"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                📊 阶段
              </label>
              <Select
                value={formData.phase}
                onChange={(e) => handleChange('phase', e.target.value)}
                className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-1"
              >
                <option value="H1">📈 H1 (上半年)</option>
                <option value="H2">📊 H2 (下半年)</option>
                <option value="custom">⚙️ 自定义</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                🎯 优先级
              </label>
              <Select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-1"
              >
                <option value="low">🟢 低</option>
                <option value="medium">🟡 中</option>
                <option value="high">🔴 高</option>
              </Select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                ⚡ 状态
              </label>
              <Select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-1"
              >
                <option value="planned">📝 计划中</option>
                <option value="in-progress">🚀 进行中</option>
                <option value="completed">✅ 已完成</option>
                <option value="blocked">🚫 已阻塞</option>
              </Select>
            </div>
          </div>
        </div>

        {/* 进度与选项区域 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-700">进度与选项</h3>
          </div>

          {/* 进度条 */}
          <div className="mb-4">
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                📊 任务进度
              </span>
              <span className="text-2xl font-bold text-orange-600">
                {Math.round((formData.progress || 0) * 100)}%
              </span>
            </label>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round((formData.progress || 0) * 100)}
                onChange={(e) => handleChange('progress', parseInt(e.target.value) / 100)}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-sm"
                style={{
                  background: `linear-gradient(to right, #f97316 0%, #f97316 ${Math.round((formData.progress || 0) * 100)}%, #e5e7eb ${Math.round((formData.progress || 0) * 100)}%, #e5e7eb 100%)`
                }}
              />
            </div>
          </div>

          {/* 里程碑选项 */}
          <div className="flex items-center p-4 bg-white rounded-xl border-2 border-dashed border-orange-200 hover:border-orange-400 transition-all">
            <input
              type="checkbox"
              checked={formData.is_milestone}
              onChange={(e) => handleChange('is_milestone', e.target.checked)}
              className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
              id="is_milestone"
            />
            <label htmlFor="is_milestone" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer select-none">
              🏆 设为里程碑 <span className="text-gray-500">(将显示为黄色菱形标记)</span>
            </label>
          </div>
        </div>

        {/* 依赖关系区域 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-medium text-gray-700">依赖关系</h3>
            </div>
            {task && (
              <button
                type="button"
                onClick={() => {
                  // 打开添加依赖关系的对话框
                  const targetTaskId = prompt('输入目标任务ID（该任务依赖的其他任务）：');
                  if (targetTaskId && targetTaskId.trim()) {
                    // 不能依赖自己
                    if (targetTaskId.trim() === task.id) {
                      alert('任务不能依赖自身');
                      return;
                    }

                    // 检查任务是否存在
                    const targetTask = tasks.find(t => t.id === targetTaskId.trim());
                    if (!targetTask) {
                      alert(`任务ID "${targetTaskId}" 不存在`);
                      return;
                    }

                    // 检查依赖关系是否已存在
                    const existingLink = links.find(
                      l => l.source === targetTaskId.trim() && l.target === task.id
                    );
                    if (existingLink) {
                      alert('该依赖关系已存在');
                      return;
                    }

                    // 添加依赖关系（finish-to-start 类型 '0'）
                    addLink({
                      source: targetTaskId.trim(),
                      target: task.id,
                      type: '0',
                    });
                  }
                }}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                添加依赖
              </button>
            )}
          </div>

          {task ? (
            <div className="space-y-2">
              {/* 前置依赖（该任务依赖的其他任务） */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">前置任务（必须先完成的任务）</h4>
                {links.filter(l => l.target === task.id).length === 0 ? (
                  <p className="text-sm text-gray-500 italic">无前置依赖</p>
                ) : (
                  <div className="space-y-2">
                    {links
                      .filter(l => l.target === task.id)
                      .map((link) => {
                        const sourceTask = tasks.find(t => t.id === link.source);
                        return (
                          <div key={link.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                            <div>
                              <span className="font-medium text-gray-800">
                                {sourceTask ? sourceTask.text : `任务 ${link.source}`}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({link.type === '0' ? '完成-开始' : '其他类型'})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('确定要删除这个依赖关系吗？')) {
                                  deleteLink(link.id);
                                }
                              }}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* 后置依赖（依赖该任务的其他任务） */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">后置任务（依赖此任务的任务）</h4>
                {links.filter(l => l.source === task.id).length === 0 ? (
                  <p className="text-sm text-gray-500 italic">无后置依赖</p>
                ) : (
                  <div className="space-y-2">
                    {links
                      .filter(l => l.source === task.id)
                      .map((link) => {
                        const targetTask = tasks.find(t => t.id === link.target);
                        return (
                          <div key={link.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                            <div>
                              <span className="font-medium text-gray-800">
                                {targetTask ? targetTask.text : `任务 ${link.target}`}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({link.type === '0' ? '完成-开始' : '其他类型'})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('确定要删除这个依赖关系吗？')) {
                                  deleteLink(link.id);
                                }
                              }}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                提示：依赖关系类型 "0" 表示"完成-开始"（前一个任务完成后，后一个任务才能开始）
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">保存任务后可以添加依赖关系</p>
          )}
        </div>

        {/* 任务描述区域 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            📝 任务描述
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            rows={4}
            placeholder="输入任务的详细描述、注意事项或备注..."
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          {/* 左侧：删除按钮（仅编辑时显示） */}
          <div>
            {task && (
              <Button
                type="button"
                onClick={() => {
                  if (confirm(`确定要删除任务 "${task.text}" 吗？\n\n此操作将同时删除该任务的所有子任务，且无法撤销。`)) {
                    console.log('🗑️ 删除任务:', task.id);
                    deleteTask(task.id);
                    onClose();
                  }
                }}
                className="px-6 py-2.5 bg-red-600 text-white hover:bg-red-700 border-none"
              >
                🗑️ 删除任务
              </Button>
            )}
          </div>

          {/* 右侧：取消和保存按钮 */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700"
            >
              {task ? '✅ 更新任务' : '➕ 创建任务'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
