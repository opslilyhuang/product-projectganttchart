/**
 * 主应用组件
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import GanttChart from '@/components/GanttChart/GanttChart';
import GanttToolbar from '@/components/GanttChart/GanttToolbar';
import TaskEditor from '@/components/GanttChart/TaskEditor';
import ResourceManager from '@/components/Resources/ResourceManager';
import { useGanttStore } from '@/stores/ganttStore';
import { useAuthStore } from '@/stores/authStore';
import { Calendar, Users, BarChart3, Package, LogOut, User, Shield, Settings } from 'lucide-react';
import type { GanttTask } from '@/types/gantt';
import '@/styles/gantt-theme.css';

type ViewMode = 'gantt' | 'product' | 'resources' | 'analytics';

export default function App() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewMode>('gantt');
  const [editingTask, setEditingTask] = useState<GanttTask | null>(null);
  const { tasks, moveTaskUp, moveTaskDown, setActiveView: setStoreActiveView, getTasksByView, copyProjectToProduct } = useGanttStore();
  const { user, logout } = useAuthStore();

  // 计算产品任务数量
  const productTasksCount = useMemo(() => getTasksByView('product').length, [tasks, getTasksByView]);

  // 同步视图状态到store
  useEffect(() => {
    if (activeView === 'gantt') {
      setStoreActiveView('project');
    } else if (activeView === 'product') {
      setStoreActiveView('product');
    }
  }, [activeView, setStoreActiveView]);

  return (
    <div className="h-screen flex flex-col bg-ai-background">
      {/* 头部 */}
      <header className="bg-ai-surface/80 backdrop-blur-sm border-b border-ai-border px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ai-text-primary">AI 项目甘特图管理系统</h1>
            <p className="text-sm text-ai-text-secondary mt-1">中源生物企业 AI 业务与决策系统 - 2026</p>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-ai-success/100 rounded-full animate-pulse"></span>
              数据自动保存中 • 点击"保存数据"按钮可导出备份
            </p>
          </div>
          <div className="flex items-center gap-6">
            {/* 用户信息 */}
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                user?.role === 'admin' ? 'bg-ai-warning/20' : 'bg-ai-primary/20'
              }`}>
                {user?.role === 'admin' ? (
                  <Shield className="w-4 h-4 text-purple-600" />
                ) : (
                  <User className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-ai-text-primary">{user?.username}</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    user?.role === 'admin'
                      ? 'bg-ai-warning/20 text-ai-warning'
                      : 'bg-ai-primary/20 text-ai-primary'
                  }`}>
                    {user?.role === 'admin' ? '管理员' : '普通用户'}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    user?.can_edit
                      ? 'bg-ai-success/20 text-ai-success'
                      : 'bg-ai-warning/20 text-ai-warning'
                  }`}>
                    {user?.can_edit ? '可编辑' : '只读'}
                  </span>
                </div>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="h-6 w-px bg-ai-border"></div>

            {/* 管理链接（仅管理员） */}
            {user?.role === 'admin' && (
              <Link
                to="/admin/users"
                className="flex items-center gap-2 text-sm text-ai-text-secondary hover:text-blue-600 transition-colors"
              >
                <Settings className="w-4 h-4" />
                用户管理
              </Link>
            )}

            {/* 登出按钮 */}
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm text-ai-text-secondary hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              登出
            </button>
          </div>
        </div>
      </header>

      {/* 视图切换标签页 */}
      <div className="bg-ai-surface/80 backdrop-blur-sm border-b border-ai-border">
        <div className="flex border-b border-ai-border">
          <button
            onClick={() => setActiveView('gantt')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'gantt'
                ? 'border-ai-primary text-ai-primary bg-ai-primary/10'
                : 'border-transparent text-ai-text-secondary hover:text-ai-text-primary hover:bg-ai-background'
            }`}
          >
            <Calendar className="w-4 h-4" />
            项目甘特图
          </button>
          <button
            onClick={() => setActiveView('product')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'product'
                ? 'border-ai-warning text-ai-warning bg-ai-warning/10'
                : 'border-transparent text-ai-text-secondary hover:text-ai-text-primary hover:bg-ai-background'
            }`}
          >
            <Package className="w-4 h-4" />
            产品甘特图
          </button>
          <button
            onClick={() => setActiveView('resources')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'resources'
                ? 'border-ai-success text-ai-success bg-ai-success/10'
                : 'border-transparent text-ai-text-secondary hover:text-ai-text-primary hover:bg-ai-background'
            }`}
          >
            <Users className="w-4 h-4" />
            资源分配
          </button>
          <button
            onClick={() => setActiveView('analytics')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'analytics'
                ? 'border-ai-primary/80 text-ai-primary/80 bg-ai-primary/10'
                : 'border-transparent text-ai-text-secondary hover:text-ai-text-primary hover:bg-ai-background'
            }`}
            disabled
            title="分析功能即将推出"
          >
            <BarChart3 className="w-4 h-4" />
            项目分析 <span className="text-xs text-gray-400">(即将推出)</span>
          </button>
        </div>
      </div>

      {/* 工具栏（甘特图视图显示） */}
      {(activeView === 'gantt' || activeView === 'product') && (
        <>
          <GanttToolbar
            onAddTask={() => setIsEditorOpen(true)}
            viewType={activeView === 'gantt' ? 'project' : 'product'}
          />
          {/* 临时测试按钮 */}
          <div className="bg-ai-warning/20 border-b border-yellow-300 px-6 py-2">
            <button
              onClick={() => {
                console.log('🧪 测试按钮点击');
                console.log('当前任务数量:', tasks.length);
                if (tasks.length > 0) {
                  console.log('准备编辑第一个任务:', tasks[0]);
                  setEditingTask(tasks[0]);
                  setIsEditorOpen(true);
                } else {
                  console.log('❌ 没有任务可编辑');
                }
              }}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              🧪 测试：打开第一个任务的编辑器
            </button>
          </div>
        </>
      )}

      {/* 主内容区域 */}
      <main className="flex-1 overflow-hidden p-6">
        {activeView === 'gantt' && (
          <GanttChart
            viewType="project"
            onTaskMove={(taskId, direction) => {
              if (direction === 'up') {
                moveTaskUp(taskId);
              } else {
                moveTaskDown(taskId);
              }
            }}
            onEditTask={(task) => {
              setEditingTask(task);
              setIsEditorOpen(true);
            }}
          />
        )}
        {activeView === 'product' && (
          <>
            {/* 产品数据为空时的提示 */}
            {productTasksCount === 0 && (
              <div className="mb-4 bg-ai-primary/10 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-ai-primary/20 rounded-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-ai-primary">产品甘特图数据为空</h3>
                      <p className="text-xs text-blue-600 mt-1">
                        产品甘特图还没有任务数据。您可以创建新任务，或者复制项目甘特图的数据作为起点。
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('确定要复制项目甘特图的所有任务到产品甘特图吗？\n\n复制后，两个甘特图的数据将独立维护，互不影响。')) {
                        copyProjectToProduct();
                      }
                    }}
                    className="px-4 py-2 bg-ai-primary text-white text-sm font-medium rounded-lg hover:bg-ai-primary/90 transition-colors"
                  >
                    复制项目数据到产品
                  </button>
                </div>
              </div>
            )}

            <GanttChart
              viewType="product"
              onTaskMove={(taskId, direction) => {
                if (direction === 'up') {
                  moveTaskUp(taskId);
                } else {
                  moveTaskDown(taskId);
                }
              }}
              onEditTask={(task) => {
                setEditingTask(task);
                setIsEditorOpen(true);
              }}
            />
          </>
        )}
        {activeView === 'resources' && <ResourceManager tasks={tasks} />}
        {activeView === 'analytics' && (
          <div className="h-full flex items-center justify-center bg-ai-surface rounded-xl border border-ai-border">
            <div className="text-center p-8">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-ai-text-primary mb-2">项目分析</h3>
              <p className="text-ai-text-secondary mb-4">高级分析功能正在开发中...</p>
              <div className="space-y-2 text-sm text-ai-text-secondary text-left max-w-md mx-auto">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-ai-primary/100 rounded-full"></div>
                  <span>项目进度分析</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-ai-success/100 rounded-full"></div>
                  <span>成本效益分析</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-ai-primary/100 rounded-full"></div>
                  <span>风险预测分析</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 任务编辑器 */}
      <TaskEditor
        task={editingTask}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingTask(null);
        }}
      />
    </div>
  );
}
