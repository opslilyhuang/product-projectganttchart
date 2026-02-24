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
  const { tasks, links, config, updateTask, deleteTask, getFilteredTasksByView, searchQueries } = useGanttStore();
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
          duration: ganttTask.duration ?? 1,
          progress: ganttTask.progress ?? 0,
          type: (ganttTask.type === 'project' || ganttTask.type === 'subtask' ? ganttTask.type : 'task') as 'project' | 'task' | 'subtask',
          parent: ganttTask.parent ? String(ganttTask.parent) : null,
          owner: ganttTask.owner || '',
          is_milestone: ganttTask.is_milestone || false,
          phase: (ganttTask.phase === 'H1' || ganttTask.phase === 'H2' ? ganttTask.phase : 'H1') as 'H1' | 'H2' | 'custom',
          priority: (ganttTask.priority === 'low' || ganttTask.priority === 'high' ? ganttTask.priority : 'medium') as 'low' | 'medium' | 'high',
          status: (ganttTask.status === 'in-progress' || ganttTask.status === 'completed' || ganttTask.status === 'blocked' ? ganttTask.status : 'planned') as 'planned' | 'in-progress' | 'completed' | 'blocked',
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
    gantt.config.drag_grid = true; // 启用网格调整
    gantt.config.grid_resize = true; // 启用列宽调整

    // 禁止在网格区域拖动任务（只在时间轴区域可以拖动）
    gantt.config.drag_task = true; // 允许拖动任务
    gantt.config.drag_project = true; // 允许拖动项目

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
        label: '结束日期 <span class="end-date-legend-icon" style="cursor:pointer;margin-left:4px;color:#f59e0b;font-weight:bold;font-size:16px;">ⓘ</span>',
        align: 'center',
        width: 120,
        resize: true,
        template: (task: any) => {
          const endDate = gantt.date.date_to_str('%Y-%m-%d')(task.end_date);
          const today = new Date();
          const taskEndDate = new Date(task.end_date);
          const daysDiff = Math.ceil((taskEndDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

          // 根据任务状态和日期返回带颜色的HTML
          let colorStyle = '';
          let colorClass = '';

          // 检查是否完成（进度100%或状态为完成）
          const isCompleted = task.status === 'completed' || task.progress >= 1;

          if (isCompleted) {
            // 已完成（包括提前完成） - 绿色
            colorStyle = 'color: #10b981; font-weight: 600;';
            colorClass = 'status-completed';
          } else if (daysDiff < 0) {
            // 已延期 - 红色
            colorStyle = 'color: #ef4444; font-weight: 600;';
            colorClass = 'status-overdue';
          } else if (task.status === 'in-progress') {
            // 进行中 - 蓝色
            colorStyle = 'color: #3b82f6; font-weight: 600;';
            colorClass = 'status-in-progress';
          } else if (daysDiff <= 7) {
            // 即将到期 - 黄色
            colorStyle = 'color: #f59e0b; font-weight: 600;';
            colorClass = 'status-near-deadline';
          } else {
            // 未开始 - 黑色
            colorStyle = 'color: #1f2937;';
            colorClass = 'status-planned';
          }

          return `<span class="${colorClass}" style="${colorStyle}">${endDate}</span>`;
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
            <div class="gantt-actions-cell" style="
              display: flex;
              gap: 4px;
              justify-content: center;
              position: relative;
              z-index: 100;
              pointer-events: auto;
              background: white;
            ">
              <button
                class="move-up-btn"
                data-task-id="${task.id}"
                data-action="move-up"
                title="上移"
                onclick="event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); window.ganttMoveTask && window.ganttMoveTask('${task.id}', 'up'); return false;"
                style="padding: 4px 8px; font-size: 12px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; min-width: 32px; position: relative; z-index: 101; pointer-events: auto;"
              >
                ↑
              </button>
              <button
                class="move-down-btn"
                data-task-id="${task.id}"
                data-action="move-down"
                title="下移"
                onclick="event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); window.ganttMoveTask && window.ganttMoveTask('${task.id}', 'down'); return false;"
                style="padding: 4px 8px; font-size: 12px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; min-width: 32px; position: relative; z-index: 101; pointer-events: auto;"
              >
                ↓
              </button>
              <button
                class="edit-task-btn"
                data-task-id="${task.id}"
                data-action="edit"
                title="编辑"
                onclick="event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); window.ganttEditTask && window.ganttEditTask('${task.id}'); return false;"
                style="padding: 4px 10px; font-size: 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; position: relative; z-index: 101; pointer-events: auto;"
              >
                编
              </button>
              <button
                class="delete-task-btn"
                data-task-id="${task.id}"
                data-action="delete"
                title="删除"
                onclick="event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); if(confirm('确定要删除此任务吗？')) { window.ganttDeleteTask && window.ganttDeleteTask('${task.id}'); } return false;"
                style="padding: 4px 10px; font-size: 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; position: relative; z-index: 101; pointer-events: auto;"
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
        // 检查是否已完成
        const isCompleted = task.status === 'completed' || (task.progress !== undefined && task.progress >= 1);

        if (task.end_date && !isCompleted) {
          const endDate = new Date(task.end_date);
          const today = new Date();
          const timeDiff = endDate.getTime() - today.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

          if (daysDiff < 0) {
            // 已超期（仅对未完成的任务）
            className += 'gantt-overdue ';
          } else if (daysDiff <= 7) {
            // 距离结束日期1周内
            className += 'gantt-near-deadline ';
          }
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
        duration: task.duration ?? 1,
        progress: task.progress ?? 0,
        text: task.text || '',
        owner: task.owner || '',
        type: (task.type === 'project' || task.type === 'subtask' ? task.type : 'task') as 'project' | 'task' | 'subtask',
        parent: task.parent ? String(task.parent) : null,
        is_milestone: task.is_milestone || false,
        phase: (task.phase === 'H1' || task.phase === 'H2' ? task.phase : 'H1') as 'H1' | 'H2' | 'custom',
        priority: (task.priority === 'low' || task.priority === 'high' ? task.priority : 'medium') as 'low' | 'medium' | 'high',
        status: (task.status === 'in-progress' || task.status === 'completed' || task.status === 'blocked' ? task.status : 'planned') as 'planned' | 'in-progress' | 'completed' | 'blocked',
        description: task.description || '',
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
          duration: ganttTask.duration ?? 1,
          progress: ganttTask.progress ?? 0,
          type: (ganttTask.type === 'project' || ganttTask.type === 'subtask' ? ganttTask.type : 'task') as 'project' | 'task' | 'subtask',
          parent: ganttTask.parent ? String(ganttTask.parent) : null,
          owner: ganttTask.owner || '',
          is_milestone: ganttTask.is_milestone || false,
          phase: (ganttTask.phase === 'H1' || ganttTask.phase === 'H2' ? ganttTask.phase : 'H1') as 'H1' | 'H2' | 'custom',
          priority: (ganttTask.priority === 'low' || ganttTask.priority === 'high' ? ganttTask.priority : 'medium') as 'low' | 'medium' | 'high',
          status: (ganttTask.status === 'in-progress' || ganttTask.status === 'completed' || ganttTask.status === 'blocked' ? ganttTask.status : 'planned') as 'planned' | 'in-progress' | 'completed' | 'blocked',
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
          duration: ganttTask.duration ?? 1,
          progress: ganttTask.progress ?? 0,
          type: (ganttTask.type === 'project' || ganttTask.type === 'subtask' ? ganttTask.type : 'task') as 'project' | 'task' | 'subtask',
          parent: ganttTask.parent ? String(ganttTask.parent) : null,
          owner: ganttTask.owner || '',
          is_milestone: ganttTask.is_milestone || false,
          phase: (ganttTask.phase === 'H1' || ganttTask.phase === 'H2' ? ganttTask.phase : 'H1') as 'H1' | 'H2' | 'custom',
          priority: (ganttTask.priority === 'low' || ganttTask.priority === 'high' ? ganttTask.priority : 'medium') as 'low' | 'medium' | 'high',
          status: (ganttTask.status === 'in-progress' || ganttTask.status === 'completed' || ganttTask.status === 'blocked' ? ganttTask.status : 'planned') as 'planned' | 'in-progress' | 'completed' | 'blocked',
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
        e.stopImmediatePropagation();

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
            // 延迟重新渲染甘特图以显示新的排序
            setTimeout(() => {
              const sortedTasks = [...filteredTasks].sort((a, b) => {
                const orderA = a.order || 0;
                const orderB = b.order || 0;
                return orderA - orderB;
              });
              gantt.clearAll();
              gantt.parse({ data: sortedTasks, links: links.filter(link =>
                filteredTasks.some(t => t.id === link.source) && filteredTasks.some(t => t.id === link.target)
              )});
              console.log('✅ 甘特图已重新渲染');
            }, 100);
          } else {
            console.log('❌ onTaskMove回调不存在');
          }
        } else if (moveDownBtn) {
          console.log('⬇️ 下移任务，taskId:', taskId, 'onTaskMove exists:', !!onTaskMove);
          if (onTaskMove) {
            onTaskMove(taskId, 'down');
            console.log('✅ onTaskMove回调已调用');
            // 延迟重新渲染甘特图以显示新的排序
            setTimeout(() => {
              const sortedTasks = [...filteredTasks].sort((a, b) => {
                const orderA = a.order || 0;
                const orderB = b.order || 0;
                return orderA - orderB;
              });
              gantt.clearAll();
              gantt.parse({ data: sortedTasks, links: links.filter(link =>
                filteredTasks.some(t => t.id === link.source) && filteredTasks.some(t => t.id === link.target)
              )});
              console.log('✅ 甘特图已重新渲染');
            }, 100);
          } else {
            console.log('❌ onTaskMove回调不存在');
          }
        } else if (editBtn) {
          console.log('📝 准备打开编辑器');
          // 编辑任务 - 从gantt实例获取最新数据
          if (onEditTask) {
            const ganttTask = gantt.getTask(taskId);
            if (ganttTask) {
              console.log('✅ 调用onEditTask，使用gantt实例中的最新数据');
              const latestTask: GanttTask = {
                id: String(ganttTask.id),
                text: ganttTask.text,
                start_date: gantt.date.date_to_str('%Y-%m-%d')(ganttTask.start_date),
                end_date: gantt.date.date_to_str('%Y-%m-%d')(ganttTask.end_date),
                duration: ganttTask.duration ?? 1,
                progress: ganttTask.progress ?? 0,
                type: (ganttTask.type === 'project' || ganttTask.type === 'subtask' ? ganttTask.type : 'task') as 'project' | 'task' | 'subtask',
                parent: ganttTask.parent ? String(ganttTask.parent) : null,
                owner: ganttTask.owner || '',
                is_milestone: ganttTask.is_milestone || false,
                phase: (ganttTask.phase === 'H1' || ganttTask.phase === 'H2' ? ganttTask.phase : 'H1') as 'H1' | 'H2' | 'custom',
                priority: (ganttTask.priority === 'low' || ganttTask.priority === 'high' ? ganttTask.priority : 'medium') as 'low' | 'medium' | 'high',
                status: (ganttTask.status === 'in-progress' || ganttTask.status === 'completed' || ganttTask.status === 'blocked' ? ganttTask.status : 'planned') as 'planned' | 'in-progress' | 'completed' | 'blocked',
                description: ganttTask.description || '',
              };
              onEditTask(latestTask);
            } else {
              console.log('❌ 在gantt实例中找不到任务:', taskId);
            }
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

    // 阻止操作列上的拖拽事件
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const actionsCell = target.closest('.gantt_cell[data-column-name="actions"]') as HTMLElement;
      const actionButton = target.closest('.move-up-btn, .move-down-btn, .edit-task-btn, .delete-task-btn') as HTMLElement;

      if (actionsCell || actionButton) {
        console.log('🚫 阻止操作列的拖拽事件');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    // 添加事件监听器
    containerRef.current?.addEventListener('click', handleButtonClick);
    containerRef.current?.addEventListener('mousedown', handleMouseDown, true); // 使用捕获阶段

    // 确认事件处理器已注册
    console.log('📋 所有事件处理器已注册:');
    console.log('  - afterUpdateHandler:', !!afterUpdateHandler);
    console.log('  - afterDeleteHandler:', !!afterDeleteHandler);
    console.log('  - beforeLightboxHandler:', !!beforeLightboxHandler);
    console.log('  - taskDblClickHandler:', !!taskDblClickHandler);

    // 创建全局函数供按钮直接调用
    (window as any).ganttMoveTask = (taskId: string, direction: 'up' | 'down') => {
      console.log('🌐 全局函数调用 ganttMoveTask:', taskId, direction);
      const moveCallback = onTaskMoveRef.current;
      if (moveCallback) {
        moveCallback(taskId, direction);

        // 延迟重新渲染甘特图以显示新的排序
        setTimeout(() => {
          const currentTasks = filteredTasksRef.current;
          const sortedTasks = [...currentTasks].sort((a, b) => {
            const orderA = a.order || 0;
            const orderB = b.order || 0;
            return orderA - orderB;
          });
          const currentLinks = linksRef.current;
          gantt.clearAll();
          gantt.parse({ data: sortedTasks, links: currentLinks.filter(link =>
            currentTasks.some(t => t.id === link.source) && currentTasks.some(t => t.id === link.target)
          )});
          console.log('✅ 甘特图已重新渲染');
        }, 100);
      }
    };

    (window as any).ganttEditTask = (taskId: string) => {
      console.log('🌐 全局函数调用 ganttEditTask:', taskId);
      const ganttTask = gantt.getTask(taskId);
      const editCallback = onEditTaskRef.current;
      if (ganttTask && editCallback) {
        const task: GanttTask = {
          id: String(ganttTask.id),
          text: ganttTask.text,
          start_date: gantt.date.date_to_str('%Y-%m-%d')(ganttTask.start_date),
          end_date: gantt.date.date_to_str('%Y-%m-%d')(ganttTask.end_date),
          duration: ganttTask.duration ?? 1,
          progress: ganttTask.progress ?? 0,
          type: (ganttTask.type === 'project' || ganttTask.type === 'subtask' ? ganttTask.type : 'task') as 'project' | 'task' | 'subtask',
          parent: ganttTask.parent ? String(ganttTask.parent) : null,
          owner: ganttTask.owner || '',
          is_milestone: ganttTask.is_milestone || false,
          phase: (ganttTask.phase === 'H1' || ganttTask.phase === 'H2' ? ganttTask.phase : 'H1') as 'H1' | 'H2' | 'custom',
          priority: (ganttTask.priority === 'low' || ganttTask.priority === 'high' ? ganttTask.priority : 'medium') as 'low' | 'medium' | 'high',
          status: (ganttTask.status === 'in-progress' || ganttTask.status === 'completed' || ganttTask.status === 'blocked' ? ganttTask.status : 'planned') as 'planned' | 'in-progress' | 'completed' | 'blocked',
          description: ganttTask.description || '',
        };
        editCallback(task);
      }
    };

    (window as any).ganttDeleteTask = (taskId: string) => {
      console.log('🌐 全局函数调用 ganttDeleteTask:', taskId);
      const deleteCallback = deleteTaskRef.current;
      if (deleteCallback) {
        deleteCallback(taskId);
      }
    };

    // 添加结束日期图例点击事件
    const handleLegendClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('end-date-legend-icon')) {
        e.preventDefault();
        e.stopPropagation();

        // 创建图例弹窗
        const modal = document.createElement('div');
        modal.id = 'gantt-legend-modal';
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        `;

        modal.innerHTML = `
          <div style="
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 400px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0;">📋 任务状态图例</h2>
              <button id="close-legend-modal" style="
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #6b7280;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
              ">&times;</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 12px; padding: 8px; background: #f9fafb; border-radius: 8px;">
                <span style="width: 24px; height: 24px; background: #10b981; border-radius: 4px; display: inline-block;"></span>
                <span style="font-size: 14px; color: #374151;"><strong>已完成</strong> - 任务已完成（包括提前完成）</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px; padding: 8px; background: #f9fafb; border-radius: 8px;">
                <span style="width: 24px; height: 24px; background: #3b82f6; border-radius: 4px; display: inline-block;"></span>
                <span style="font-size: 14px; color: #374151;"><strong>进行中</strong> - 任务正在进行中且进度正常</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px; padding: 8px; background: #f9fafb; border-radius: 8px;">
                <span style="width: 24px; height: 24px; background: #ef4444; border-radius: 4px; display: inline-block;"></span>
                <span style="font-size: 14px; color: #374151;"><strong>已延期</strong> - 任务已超过结束日期但未完成</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px; padding: 8px; background: #f9fafb; border-radius: 8px;">
                <span style="width: 24px; height: 24px; background: #f59e0b; border-radius: 4px; display: inline-block;"></span>
                <span style="font-size: 14px; color: #374151;"><strong>即将到期</strong> - 距离结束日期7天内</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px; padding: 8px; background: #f9fafb; border-radius: 8px;">
                <span style="width: 24px; height: 24px; background: #1f2937; border-radius: 4px; display: inline-block;"></span>
                <span style="font-size: 14px; color: #374151;"><strong>未开始</strong> - 任务尚未开始</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px; padding: 8px; background: #f9fafb; border-radius: 8px;">
                <span style="width: 24px; height: 24px; background: #8b5cf6; border-radius: 4px; display: inline-block;"></span>
                <span style="font-size: 14px; color: #374151;"><strong>已阻塞</strong> - 任务被阻塞无法进行</span>
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        // 点击关闭按钮或背景关闭弹窗
        const closeBtn = modal.querySelector('#close-legend-modal');
        const closeModal = () => {
          document.body.removeChild(modal);
        };
        closeBtn?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            closeModal();
          }
        });
      }
    };

    containerRef.current?.addEventListener('click', handleLegendClick);

    // 清理函数
    return () => {
      if (afterUpdateHandler) gantt.detachEvent(afterUpdateHandler);
      if (afterDeleteHandler) gantt.detachEvent(afterDeleteHandler);
      if (beforeLightboxHandler) gantt.detachEvent(beforeLightboxHandler);
      if (taskDblClickHandler) gantt.detachEvent(taskDblClickHandler);
      containerRef.current?.removeEventListener('click', handleButtonClick);
      containerRef.current?.removeEventListener('mousedown', handleMouseDown, true);
      containerRef.current?.removeEventListener('click', handleLegendClick);

      // 清理全局函数
      delete (window as any).ganttMoveTask;
      delete (window as any).ganttEditTask;
      delete (window as any).ganttDeleteTask;
    };
  }, [isInitialized]);

  // 使用ref保存最新的filteredTasks和links
  const filteredTasksRef = useRef(filteredTasks);
  const linksRef = useRef(links);
  const onTaskMoveRef = useRef(onTaskMove);
  const onEditTaskRef = useRef(onEditTask);
  const deleteTaskRef = useRef(deleteTask);

  useEffect(() => {
    filteredTasksRef.current = filteredTasks;
    linksRef.current = links;
    onTaskMoveRef.current = onTaskMove;
    onEditTaskRef.current = onEditTask;
    deleteTaskRef.current = deleteTask;
  }, [filteredTasks, links, onTaskMove, onEditTask, deleteTask]);

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
