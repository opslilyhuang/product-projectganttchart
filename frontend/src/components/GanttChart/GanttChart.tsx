/**
 * DHTMLX 甘特图主组件
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { useGanttStore } from '@/stores/ganttStore';
import { getCriticalPathVisualization } from '@/utils/criticalPathCalculator';
import type { ViewMode, GanttTask } from '@/types/gantt';

interface GanttChartProps {
  onEditTask?: (task: GanttTask) => void;
  onTaskMove?: (taskId: string, direction: 'up' | 'down') => void;
  viewType?: 'project' | 'product';
}

export default function GanttChart({ onEditTask, onTaskMove, viewType = 'project' }: GanttChartProps) {
  console.log('GanttChart rendering, onEditTask:', onEditTask, 'viewType:', viewType);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const { tasks, links, config, updateTask, deleteTask, getTasksByView, getFilteredTasksByView, searchQueries } = useGanttStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 根据viewType过滤任务（包括搜索过滤）
  const filteredTasks = useMemo(() => {
    const tasks = getFilteredTasksByView(viewType);
    console.log(`🔍 filteredTasks更新: viewType=${viewType}, 任务数量=${tasks.length}`);
    if (tasks.length > 0) {
      console.log('🔍 前3个任务:', tasks.slice(0, 3).map(t => ({ id: t.id, text: t.text, order: t.order })));
    }
    return tasks;
  }, [tasks, viewType, getFilteredTasksByView, searchQueries]);

  // 计算关键路径
  const criticalPath = useMemo(() => {
    if (!config.showCriticalPath) return null;
    try {
      return getCriticalPathVisualization(filteredTasks, links);
    } catch (error) {
      console.error('Failed to calculate critical path:', error);
      return null;
    }
  }, [filteredTasks, links, config.showCriticalPath]);

  // 配置时间轴视图
  const configureTimeScale = (view: ViewMode) => {
    switch (view) {
      case 'day':
        gantt.config.scales = [
          { unit: 'day', step: 1, date: '%d %M' },
          { unit: 'hour', step: 6, date: '%H:%i' }
        ];
        break;
      case 'week':
        gantt.config.scales = [
          { unit: 'week', step: 1, date: '第 %W 周' },
          { unit: 'day', step: 1, date: '%d %M' }
        ];
        break;
      case 'month':
        gantt.config.scales = [
          { unit: 'month', step: 1, date: '%Y年%M' },
          { unit: 'week', step: 1, date: '第%W周' }
        ];
        break;
      case 'quarter':
        gantt.config.scales = [
          { unit: 'month', step: 3, date: '%Y年 Q%q' },
          { unit: 'month', step: 1, date: '%M' }
        ];
        break;
    }
  };

  // 初始化甘特图
  useEffect(() => {
    console.log('GanttChart useEffect running, isInitialized:', isInitialized);
    if (!containerRef.current || initializedRef.current) return;

    gantt.config.date_format = '%Y-%m-%d';
    gantt.config.readonly = config.readonly;
    gantt.config.show_progress = config.showProgress;
    gantt.config.auto_scheduling = true;
    gantt.config.auto_scheduling_strict = false;

    // 完全禁用DHTMLX的lightbox编辑器
    gantt.config.details_on_create = false;
    gantt.config.details_on_dblclick = false;

    // 清空lightbox配置，防止其打开
    gantt.config.lightbox = {
      sections: []
    };

    // 重写showLightbox函数，直接打开我们的编辑器
    const originalShowLightbox = gantt.showLightbox;
    gantt.showLightbox = function(id: any) {
      console.log('🚫 拦截showLightbox, id:', id);
      console.log('onEditTask存在?', !!onEditTask);

      const ganttTask = gantt.getTask(id);
      console.log('任务数据:', ganttTask);

      if (ganttTask && onEditTask) {
        const task: GanttTask = {
          id: String(ganttTask.id),
          text: ganttTask.text,
          start_date: gantt.date.date_to_str('%Y-%m-%d')(ganttTask.start_date),
          end_date: gantt.date.date_to_str('%Y-%m-%d')(ganttTask.end_date),
          duration: ganttTask.duration,
          progress: ganttTask.progress,
          type: ganttTask.type || 'task',
          parent: ganttTask.parent || null,
          owner: ganttTask.owner || '',
          is_milestone: ganttTask.is_milestone || false,
          phase: ganttTask.phase || 'H1',
          priority: ganttTask.priority || 'medium',
          status: ganttTask.status || 'planned',
          description: ganttTask.description || '',
        };
        console.log('✅ 准备调用onEditTask，任务:', task);
        try {
          onEditTask(task);
          console.log('✅ onEditTask已调用');
        } catch (err) {
          console.error('❌ 调用onEditTask失败:', err);
        }
        return; // 不调用原始的showLightbox
      } else {
        console.log('❌ 无法打开编辑器: ganttTask=', !!ganttTask, 'onEditTask=', !!onEditTask);
      }
      // 如果没有onEditTask回调，则使用原始方法
      originalShowLightbox.call(gantt, id);
    };

    // 拖拽配置
    gantt.config.drag_progress = true;
    gantt.config.drag_resize = true;
    gantt.config.drag_move = true;
    gantt.config.drag_links = true;

    // 列配置
    gantt.config.columns = [
      {
        name: 'text',
        label: '任务名称',
        tree: true,
        width: 350,
        resize: true,
        template: (task) => {
          const milestonePrefix = task.is_milestone ? '◆ ' : '';
          return milestonePrefix + (task.text || '');
        }
      },
      {
        name: 'start_date',
        label: '开始日期',
        align: 'center',
        width: 120,
        resize: true,
      },
      {
        name: 'end_date',
        label: '结束日期',
        align: 'center',
        width: 120,
        resize: true,
        template: (task: any) => {
          return gantt.date.date_to_str('%Y-%m-%d')(task.end_date);
        }
      },
      {
        name: 'duration',
        label: '工期',
        align: 'center',
        width: 60,
        resize: true,
      },
      {
        name: 'owner',
        label: '负责人',
        align: 'center',
        width: 100,
        resize: true,
      },
      {
        name: 'progress',
        label: '进度',
        align: 'center',
        width: 80,
        template: (task: any) => `${Math.round(task.progress * 100)}%`,
      },
      {
        name: 'actions',
        label: '操作',
        align: 'center',
        width: 140,
        template: (task: any) => {
          return `
            <div style="display: flex; gap: 4px; justify-content: center;">
              <button
                class="move-up-btn"
                data-task-id="${task.id}"
                title="上移"
                style="padding: 4px 8px; font-size: 12px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; min-width: 32px;"
              >
                ↑
              </button>
              <button
                class="move-down-btn"
                data-task-id="${task.id}"
                title="下移"
                style="padding: 4px 8px; font-size: 12px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; min-width: 32px;"
              >
                ↓
              </button>
              <button
                class="edit-task-btn"
                data-task-id="${task.id}"
                title="编辑"
                style="padding: 4px 10px; font-size: 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;"
              >
                编
              </button>
              <button
                class="delete-task-btn"
                data-task-id="${task.id}"
                title="删除"
                style="padding: 4px 10px; font-size: 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;"
              >
                删
              </button>
            </div>
          `;
        }
      },
    ];

    // 配置时间轴
    configureTimeScale(config.view);

    // 自定义任务样式
    gantt.templates.task_class = (_start, _end, task) => {
      let className = '';

      // 基础类型样式
      if (task.is_milestone) {
        className += 'gantt-milestone ';
      }
      if (task.type === 'project') {
        className += 'gantt-project ';
      } else {
        className += (task.type || 'gantt-task') + ' ';
      }

      // 关键路径样式
      if (config.showCriticalPath && criticalPath) {
        const taskId = String(task.id);
        const isCritical = criticalPath.criticalTasks.includes(taskId);
        if (isCritical) {
          className += 'gantt-critical-task ';
        }

        // 如果是关键路径上的第一个任务
        if (criticalPath.criticalPath[0] === taskId) {
          className += 'gantt-critical-start ';
        }

        // 如果是关键路径上的最后一个任务
        if (criticalPath.criticalPath[criticalPath.criticalPath.length - 1] === taskId) {
          className += 'gantt-critical-end ';
        }
      }

      // 状态样式
      if (task.status) {
        if (task.status === 'planned') {
          className += 'gantt-status-planned ';
        } else if (task.status === 'in-progress') {
          className += 'gantt-status-in-progress ';
        } else if (task.status === 'completed') {
          className += 'gantt-status-completed ';
        } else if (task.status === 'blocked') {
          className += 'gantt-status-blocked ';
        }
      }

      // 时间预警样式
      try {
        const endDate = new Date(task.end_date);
        const today = new Date();
        const timeDiff = endDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysDiff < 0) {
          // 已超期
          className += 'gantt-overdue ';
        } else if (daysDiff <= 7) {
          // 距离结束日期1周内
          className += 'gantt-near-deadline ';
        }
      } catch (error) {
        // 日期解析失败，忽略
      }

      return className.trim();
    };

    // 里程碑自定义显示
    gantt.templates.task_text = (_start, _end, task) => {
      if (task.is_milestone) return '◆ ' + task.text;
      return task.text;
    };

    // 关键路径依赖线样式
    gantt.templates.link_class = (link) => {
      if (config.showCriticalPath && criticalPath) {
        // 检查这个依赖是否在关键路径上
        const isCriticalLink = criticalPath.criticalLinks.some(
          (criticalLink) =>
            criticalLink.source === String(link.source) && criticalLink.target === String(link.target)
        );
        if (isCriticalLink) {
          return 'gantt_critical_link';
        }
      }
      return '';
    };

    // 初始化
    try {
      console.log('🚀 正在初始化甘特图...');
      gantt.init(containerRef.current);
      initializedRef.current = true;
      setIsInitialized(true);
      console.log('✅ 甘特图初始化成功');
    } catch (err) {
      console.error('Failed to initialize Gantt chart:', err);
      setError(`甘特图初始化失败: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    // 事件监听
    const afterUpdateHandler = gantt.attachEvent('onAfterTaskUpdate', (id, task) => {
      updateTask(String(id), {
        start_date: gantt.date.date_to_str('%Y-%m-%d')(task.start_date),
        end_date: gantt.date.date_to_str('%Y-%m-%d')(task.end_date),
        duration: task.duration,
        progress: task.progress,
        text: task.text,
        owner: task.owner,
        type: task.type,
        parent: task.parent,
        is_milestone: task.is_milestone,
        phase: task.phase,
        priority: task.priority,
        status: task.status,
        description: task.description,
      });
      return true;
    });

    const afterDeleteHandler = gantt.attachEvent('onAfterTaskDelete', (id) => {
      deleteTask(String(id));
      return true;
    });

    // 拦截默认lightbox，使用我们的编辑器
    const beforeLightboxHandler = gantt.attachEvent('onBeforeLightbox', (id) => {
      console.log('⚡ onBeforeLightbox triggered for id:', id);

      // 立即隐藏lightbox
      setTimeout(() => {
        gantt.hideLightbox();
      }, 0);

      const ganttTask = gantt.getTask(id);
      if (ganttTask && onEditTask) {
        const task: GanttTask = {
          id: String(ganttTask.id),
          text: ganttTask.text,
          start_date: gantt.date.date_to_str('%Y-%m-%d')(ganttTask.start_date),
          end_date: gantt.date.date_to_str('%Y-%m-%d')(ganttTask.end_date),
          duration: ganttTask.duration,
          progress: ganttTask.progress,
          type: ganttTask.type || 'task',
          parent: ganttTask.parent || null,
          owner: ganttTask.owner || '',
          is_milestone: ganttTask.is_milestone || false,
          phase: ganttTask.phase || 'H1',
          priority: ganttTask.priority || 'medium',
          status: ganttTask.status || 'planned',
          description: ganttTask.description || '',
        };
        console.log('✅ 打开自定义编辑器');
        onEditTask(task);
      }
      return false; // 阻止默认lightbox
    });

    // 双击任务打开编辑器
    const taskDblClickHandler = gantt.attachEvent('onTaskDblClick', (id, e) => {
      console.log('🎯 Task double clicked!!! id:', id, 'event:', e);
      console.log('onEditTask callback exists?', !!onEditTask);

      // 从gantt实例获取最新的任务数据
      const ganttTask = gantt.getTask(id);
      console.log('Gantt task data:', ganttTask);

      if (ganttTask && onEditTask) {
        // 转换为我们的GanttTask格式
        const task: GanttTask = {
          id: String(ganttTask.id),
          text: ganttTask.text,
          start_date: gantt.date.date_to_str('%Y-%m-%d')(ganttTask.start_date),
          end_date: gantt.date.date_to_str('%Y-%m-%d')(ganttTask.end_date),
          duration: ganttTask.duration,
          progress: ganttTask.progress,
          type: ganttTask.type || 'task',
          parent: ganttTask.parent || null,
          owner: ganttTask.owner || '',
          is_milestone: ganttTask.is_milestone || false,
          phase: ganttTask.phase || 'H1',
          priority: ganttTask.priority || 'medium',
          status: ganttTask.status || 'planned',
          description: ganttTask.description || '',
        };
        console.log('✅ Calling onEditTask with task:', task);
        onEditTask(task);
      } else {
        console.log('❌ Cannot open editor: ganttTask=', ganttTask, 'onEditTask=', onEditTask);
      }
      return false; // 阻止DHTMLX默认的双击行为
    });

    // 添加编辑/删除按钮点击事件监听
    const handleButtonClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      console.log('🖱️ 点击事件触发，目标:', target.className);

      const moveUpBtn = target.closest('.move-up-btn') as HTMLElement;
      const moveDownBtn = target.closest('.move-down-btn') as HTMLElement;
      const editBtn = target.closest('.edit-task-btn') as HTMLElement;
      const deleteBtn = target.closest('.delete-task-btn') as HTMLElement;

      if (moveUpBtn || moveDownBtn || editBtn || deleteBtn) {
        console.log('✅ 检测到按钮点击:',
          moveUpBtn ? '上移' :
          moveDownBtn ? '下移' :
          editBtn ? '编辑' : '删除');
        e.preventDefault();
        e.stopPropagation();

        const taskId = (moveUpBtn || moveDownBtn || editBtn || deleteBtn)?.getAttribute('data-task-id');
        console.log('任务ID:', taskId);

        if (!taskId) {
          console.log('❌ 没有找到任务ID');
          return;
        }

        const task = tasks.find(t => t.id === taskId);
        console.log('找到的任务:', task);

        if (!task) {
          console.log('❌ 在tasks中找不到该任务');
          return;
        }

        if (moveUpBtn) {
          console.log('⬆️ 上移任务，taskId:', taskId, 'onTaskMove exists:', !!onTaskMove);
          if (onTaskMove) {
            onTaskMove(taskId, 'up');
            console.log('✅ onTaskMove回调已调用');
          } else {
            console.log('❌ onTaskMove回调不存在');
          }
        } else if (moveDownBtn) {
          console.log('⬇️ 下移任务，taskId:', taskId, 'onTaskMove exists:', !!onTaskMove);
          if (onTaskMove) {
            onTaskMove(taskId, 'down');
            console.log('✅ onTaskMove回调已调用');
          } else {
            console.log('❌ onTaskMove回调不存在');
          }
        } else if (editBtn) {
          console.log('📝 准备打开编辑器');
          // 编辑任务 - 调用父组件的编辑回调
          if (onEditTask) {
            console.log('✅ 调用onEditTask');
            onEditTask(task);
          } else {
            console.log('❌ onEditTask不存在');
          }
        } else if (deleteBtn) {
          if (confirm(`确定要删除任务 "${task.text}" 吗？`)) {
            deleteTask(taskId);
          }
        }
      }
    };

    // 添加事件监听器
    containerRef.current?.addEventListener('click', handleButtonClick);

    // 确认事件处理器已注册
    console.log('📋 所有事件处理器已注册:');
    console.log('  - afterUpdateHandler:', !!afterUpdateHandler);
    console.log('  - afterDeleteHandler:', !!afterDeleteHandler);
    console.log('  - beforeLightboxHandler:', !!beforeLightboxHandler);
    console.log('  - taskDblClickHandler:', !!taskDblClickHandler);

    // 清理函数
    return () => {
      if (afterUpdateHandler) gantt.detachEvent(afterUpdateHandler);
      if (afterDeleteHandler) gantt.detachEvent(afterDeleteHandler);
      if (beforeLightboxHandler) gantt.detachEvent(beforeLightboxHandler);
      if (taskDblClickHandler) gantt.detachEvent(taskDblClickHandler);
      containerRef.current?.removeEventListener('click', handleButtonClick);
    };
  }, [isInitialized]);

  // 使用ref保存最新的filteredTasks和links
  const filteredTasksRef = useRef(filteredTasks);
  const linksRef = useRef(links);

  useEffect(() => {
    filteredTasksRef.current = filteredTasks;
    linksRef.current = links;
  }, [filteredTasks, links]);

  // 更新数据
  useEffect(() => {
    if (!isInitialized) return;

    console.log('🔄 更新甘特图数据，任务数量:', filteredTasks.length);

    // 按order字段排序任务
    const sortedTasks = [...filteredTasks].sort((a, b) => {
      const orderA = a.order || 0;
      const orderB = b.order || 0;
      return orderA - orderB;
    });

    // 过滤链接：只包含source和target都在当前视图任务中的链接
    const filteredTaskIds = new Set(filteredTasks.map(t => t.id));
    const filteredLinks = links.filter(link =>
      filteredTaskIds.has(link.source) && filteredTaskIds.has(link.target)
    );

    console.log('📊 排序后的任务（前5个）:', sortedTasks.slice(0, 5).map(t => ({ id: t.id, text: t.text, order: t.order })));
    console.log('🔗 过滤后的链接数量:', filteredLinks.length, '总链接数量:', links.length);

    gantt.clearAll();
    gantt.parse({ data: sortedTasks, links: filteredLinks });
  }, [filteredTasks, links, isInitialized]);

  // 更新视图
  useEffect(() => {
    if (!isInitialized) return;

    console.log('View changed to:', config.view);

    // 配置时间轴
    configureTimeScale(config.view);

    // 按order字段排序任务
    const sortedTasks = [...filteredTasksRef.current].sort((a, b) => {
      const orderA = a.order || 0;
      const orderB = b.order || 0;
      return orderA - orderB;
    });

    // 过滤链接：只包含source和target都在当前视图任务中的链接
    const filteredTaskIds = new Set(filteredTasksRef.current.map(t => t.id));
    const filteredLinks = linksRef.current.filter(link =>
      filteredTaskIds.has(link.source) && filteredTaskIds.has(link.target)
    );

    console.log('🔄 视图切换，任务数量:', sortedTasks.length, '过滤后链接数量:', filteredLinks.length);

    // 清空并重新加载数据以确保时间轴正确更新
    gantt.clearAll();
    gantt.parse({ data: sortedTasks, links: filteredLinks });

    // 强制重新渲染时间轴
    gantt.render();
  }, [config.view, isInitialized]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-medium text-red-800">甘特图加载失败</h3>
        <p className="text-red-600 mt-2">{error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="gantt-container"
      style={{ width: '100%', height: 'calc(100vh - 140px)' }}
    />
  );
}
