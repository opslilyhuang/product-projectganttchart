/**
 * 数据格式转换工具
 */

import type { GanttTask, GanttData } from '@/types/gantt';

/**
 * 验证导入的数据格式
 */
export function validateGanttData(data: any): data is GanttData {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.tasks)) return false;
  if (!Array.isArray(data.links)) return false;
  if (!data.config || typeof data.config !== 'object') return false;

  // 验证任务基本字段
  for (const task of data.tasks) {
    if (!task.id || !task.text || !task.start_date || !task.end_date) {
      return false;
    }
  }

  return true;
}

/**
 * 清理和标准化任务数据
 */
export function normalizeTask(task: Partial<GanttTask>): GanttTask {
  return {
    id: task.id || `task-${Date.now()}`,
    text: task.text || 'Untitled Task',
    type: task.type || 'task',
    parent: task.parent || null,
    start_date: task.start_date || new Date().toISOString().split('T')[0],
    end_date: task.end_date || new Date().toISOString().split('T')[0],
    duration: task.duration || 1,
    progress: Math.max(0, Math.min(1, task.progress || 0)),
    status: task.status || 'planned',
    owner: task.owner || '',
    phase: task.phase || 'H1',
    priority: task.priority || 'medium',
    description: task.description || '',
    is_milestone: task.is_milestone || false,
    color: task.color,
    readonly: task.readonly,
    open: task.open,
  };
}

/**
 * 导出为 JSON 字符串
 */
export function exportToJSON(data: GanttData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * 从 JSON 字符串导入
 */
export function importFromJSON(json: string): GanttData | null {
  try {
    const data = JSON.parse(json);
    if (validateGanttData(data)) {
      return data;
    }
    throw new Error('Invalid data format');
  } catch (error) {
    console.error('Failed to import JSON:', error);
    return null;
  }
}
