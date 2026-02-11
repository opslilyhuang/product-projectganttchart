/**
 * 关键路径计算工具 (Critical Path Method - CPM)
 * 使用经典CPM算法计算项目关键路径
 */

import type { GanttTask, TaskLink } from '@/types/gantt';

/**
 * 任务关键路径信息
 */
export interface CriticalPathInfo {
  id: string;
  text: string;
  isCritical: boolean;      // 是否为关键任务
  earliestStart: number;    // 最早开始时间（从项目开始的天数）
  earliestFinish: number;   // 最早完成时间
  latestStart: number;      // 最晚开始时间
  latestFinish: number;     // 最晚完成时间
  totalFloat: number;       // 总浮动时间
  freeFloat: number;        // 自由浮动时间
}

/**
 * 关键路径计算结果
 */
export interface CriticalPathResult {
  criticalTasks: string[];           // 关键任务ID列表
  criticalPath: string[];            // 关键路径上的任务ID序列
  projectDuration: number;           // 项目总工期（天数）
  tasksInfo: Map<string, CriticalPathInfo>;  // 所有任务的关键路径信息
}

/**
 * 计算关键路径（主函数）
 * @param tasks 任务列表
 * @param links 依赖关系列表
 * @returns 关键路径计算结果
 */
export function calculateCriticalPath(
  tasks: GanttTask[],
  links: TaskLink[]
): CriticalPathResult {
  // 验证输入数据
  if (!tasks.length) {
    return {
      criticalTasks: [],
      criticalPath: [],
      projectDuration: 0,
      tasksInfo: new Map(),
    };
  }

  try {
    // 1. 构建任务映射表和依赖关系图
    const taskMap = buildTaskMap(tasks);
    const { predecessors, successors } = buildDependencyGraph(tasks, links);

    // 2. 找到所有起始任务（没有前置依赖的任务）
    const startTasks = findStartTasks(tasks, predecessors);

    // 3. 计算正向传递（最早开始和最早完成时间）
    const { earliestStart, earliestFinish } = calculateForwardPass(
      tasks,
      taskMap,
      predecessors,
      successors
    );

    // 4. 计算项目总工期
    const projectDuration = calculateProjectDuration(earliestFinish);

    // 5. 计算反向传递（最晚开始和最晚完成时间）
    const { latestStart, latestFinish } = calculateBackwardPass(
      tasks,
      taskMap,
      predecessors,
      successors,
      projectDuration
    );

    // 6. 计算浮动时间并识别关键任务
    const { tasksInfo, criticalTasks } = calculateFloatsAndIdentifyCritical(
      tasks,
      earliestStart,
      earliestFinish,
      latestStart,
      latestFinish
    );

    // 7. 找到关键路径（从开始到结束的关键任务序列）
    const criticalPath = findCriticalPathSequence(
      criticalTasks,
      successors,
      startTasks
    );

    return {
      criticalTasks,
      criticalPath,
      projectDuration,
      tasksInfo,
    };
  } catch (error) {
    console.error('关键路径计算错误:', error);
    return {
      criticalTasks: [],
      criticalPath: [],
      projectDuration: 0,
      tasksInfo: new Map(),
    };
  }
}

/**
 * 构建任务ID到任务的映射表
 */
function buildTaskMap(tasks: GanttTask[]): Map<string, GanttTask> {
  const taskMap = new Map<string, GanttTask>();
  tasks.forEach((task) => {
    taskMap.set(task.id, task);
  });
  return taskMap;
}

/**
 * 构建依赖关系图（前置任务和后置任务）
 */
function buildDependencyGraph(tasks: GanttTask[], links: TaskLink[]) {
  const predecessors = new Map<string, TaskLink[]>(); // 任务ID -> 前置依赖列表
  const successors = new Map<string, TaskLink[]>();   // 任务ID -> 后置依赖列表

  // 初始化所有任务的映射
  tasks.forEach((task) => {
    predecessors.set(task.id, []);
    successors.set(task.id, []);
  });

  // 填充依赖关系
  links.forEach((link) => {
    // 只处理 finish-to-start (类型'0') 依赖，这是最常用的类型
    if (link.type === '0') {
      const sourceTask = tasks.find((t) => t.id === link.source);
      const targetTask = tasks.find((t) => t.id === link.target);

      if (sourceTask && targetTask) {
        // 添加前置关系：target 依赖 source
        const targetPreds = predecessors.get(link.target) || [];
        targetPreds.push(link);
        predecessors.set(link.target, targetPreds);

        // 添加后置关系：source 被 target 依赖
        const sourceSuccs = successors.get(link.source) || [];
        sourceSuccs.push(link);
        successors.set(link.source, sourceSuccs);
      }
    }
  });

  return { predecessors, successors };
}

/**
 * 找到起始任务（没有前置依赖的任务）
 */
function findStartTasks(tasks: GanttTask[], predecessors: Map<string, TaskLink[]>) {
  const startTasks: string[] = [];

  tasks.forEach((task) => {
    const preds = predecessors.get(task.id) || [];
    if (preds.length === 0) {
      startTasks.push(task.id);
    }
  });

  return startTasks;
}

/**
 * 计算正向传递（最早开始和最早完成时间）
 */
function calculateForwardPass(
  tasks: GanttTask[],
  taskMap: Map<string, GanttTask>,
  predecessors: Map<string, TaskLink[]>,
  successors: Map<string, TaskLink[]>
) {
  const earliestStart = new Map<string, number>();
  const earliestFinish = new Map<string, number>();

  // 初始化所有任务
  tasks.forEach((task) => {
    earliestStart.set(task.id, 0);
    earliestFinish.set(task.id, 0);
  });

  // 拓扑排序（确保在处理任务前先处理其所有前置任务）
  const sortedTasks = topologicalSort(tasks, predecessors, successors);

  // 计算最早开始和完成时间
  sortedTasks.forEach((taskId) => {
    const task = taskMap.get(taskId);
    if (!task) return;

    // 获取所有前置任务
    const preds = predecessors.get(taskId) || [];

    if (preds.length === 0) {
      // 没有前置任务，最早开始时间为0
      earliestStart.set(taskId, 0);
    } else {
      // 最早开始时间 = 所有前置任务的最早完成时间的最大值
      let maxEarliestFinish = 0;
      preds.forEach((link) => {
        const predFinish = earliestFinish.get(link.source) || 0;
        maxEarliestFinish = Math.max(maxEarliestFinish, predFinish);
      });
      earliestStart.set(taskId, maxEarliestFinish);
    }

    // 最早完成时间 = 最早开始时间 + 任务工期
    const taskDuration = task.duration || 1; // 确保至少1天
    earliestFinish.set(taskId, earliestStart.get(taskId)! + taskDuration);
  });

  return { earliestStart, earliestFinish };
}

/**
 * 计算项目总工期
 */
function calculateProjectDuration(
  earliestFinish: Map<string, number>
): number {
  let maxDuration = 0;
  earliestFinish.forEach((finishTime) => {
    maxDuration = Math.max(maxDuration, finishTime);
  });
  return maxDuration;
}

/**
 * 计算反向传递（最晚开始和最晚完成时间）
 */
function calculateBackwardPass(
  tasks: GanttTask[],
  taskMap: Map<string, GanttTask>,
  predecessors: Map<string, TaskLink[]>,
  successors: Map<string, TaskLink[]>,
  projectDuration: number
) {
  const latestStart = new Map<string, number>();
  const latestFinish = new Map<string, number>();

  // 初始化所有任务
  tasks.forEach((task) => {
    latestStart.set(task.id, projectDuration);
    latestFinish.set(task.id, projectDuration);
  });

  // 逆拓扑排序（确保在处理任务前先处理其所有后置任务）
  const sortedTasks = topologicalSort(tasks, predecessors, successors).reverse();

  // 计算最晚开始和完成时间
  sortedTasks.forEach((taskId) => {
    const task = taskMap.get(taskId);
    if (!task) return;

    // 获取所有后置任务
    const succs = successors.get(taskId) || [];

    if (succs.length === 0) {
      // 没有后置任务，最晚完成时间 = 项目总工期
      latestFinish.set(taskId, projectDuration);
    } else {
      // 最晚完成时间 = 所有后置任务的最晚开始时间的最小值
      let minLatestStart = projectDuration;
      succs.forEach((link) => {
        const succStart = latestStart.get(link.target) || projectDuration;
        minLatestStart = Math.min(minLatestStart, succStart);
      });
      latestFinish.set(taskId, minLatestStart);
    }

    // 最晚开始时间 = 最晚完成时间 - 任务工期
    const taskDuration = task.duration || 1;
    latestStart.set(taskId, latestFinish.get(taskId)! - taskDuration);
  });

  return { latestStart, latestFinish };
}

/**
 * 计算浮动时间并识别关键任务
 */
function calculateFloatsAndIdentifyCritical(
  tasks: GanttTask[],
  earliestStart: Map<string, number>,
  earliestFinish: Map<string, number>,
  latestStart: Map<string, number>,
  latestFinish: Map<string, number>
) {
  const tasksInfo = new Map<string, CriticalPathInfo>();
  const criticalTasks: string[] = [];

  tasks.forEach((task) => {
    const es = earliestStart.get(task.id) || 0;
    const ef = earliestFinish.get(task.id) || 0;
    const ls = latestStart.get(task.id) || 0;
    const lf = latestFinish.get(task.id) || 0;

    // 计算总浮动时间
    const totalFloat = Math.max(0, ls - es); // 或 lf - ef

    // 计算自由浮动时间（简化版：假设为总浮动时间）
    const freeFloat = totalFloat;

    // 判断是否为关键任务（总浮动时间为0）
    const isCritical = totalFloat === 0;

    const info: CriticalPathInfo = {
      id: task.id,
      text: task.text,
      isCritical,
      earliestStart: es,
      earliestFinish: ef,
      latestStart: ls,
      latestFinish: lf,
      totalFloat,
      freeFloat,
    };

    tasksInfo.set(task.id, info);

    if (isCritical) {
      criticalTasks.push(task.id);
    }
  });

  return { tasksInfo, criticalTasks };
}

/**
 * 找到关键路径序列（从起始到结束的关键任务连接路径）
 */
function findCriticalPathSequence(
  criticalTasks: string[],
  successors: Map<string, TaskLink[]>,
  startTasks: string[]
): string[] {
  if (criticalTasks.length === 0) return [];

  // 从起始关键任务开始
  const startCriticalTasks = criticalTasks.filter((id) =>
    startTasks.includes(id)
  );

  if (startCriticalTasks.length === 0) return [];

  // 使用深度优先搜索找到关键路径
  const path: string[] = [];
  const visited = new Set<string>();

  // 从每个起始关键任务开始搜索
  for (const startTask of startCriticalTasks) {
    const currentPath = dfsCriticalPath(startTask, criticalTasks, successors, visited);
    if (currentPath.length > path.length) {
      // 保留最长路径（主关键路径）
      path.length = 0;
      currentPath.forEach((taskId) => path.push(taskId));
    }
  }

  return path;
}

/**
 * 深度优先搜索查找关键路径
 */
function dfsCriticalPath(
  currentTask: string,
  criticalTasks: string[],
  successors: Map<string, TaskLink[]>,
  visited: Set<string>
): string[] {
  if (visited.has(currentTask)) return [];
  visited.add(currentTask);

  // 获取当前任务的后置关键任务
  const succs = successors.get(currentTask) || [];
  const criticalSuccs = succs
    .map((link) => link.target)
    .filter((target) => criticalTasks.includes(target));

  if (criticalSuccs.length === 0) {
    // 到达终点
    return [currentTask];
  }

  // 递归查找最长路径
  let longestPath: string[] = [];
  for (const succ of criticalSuccs) {
    const subPath = dfsCriticalPath(succ, criticalTasks, successors, visited);
    if (subPath.length > longestPath.length) {
      longestPath = [currentTask, ...subPath];
    }
  }

  return longestPath;
}

/**
 * 拓扑排序（Kahn算法）
 */
function topologicalSort(
  tasks: GanttTask[],
  predecessors: Map<string, TaskLink[]>,
  successors: Map<string, TaskLink[]>
): string[] {
  const sorted: string[] = [];
  const inDegree = new Map<string, number>();

  // 初始化入度
  tasks.forEach((task) => {
    const preds = predecessors.get(task.id) || [];
    inDegree.set(task.id, preds.length);
  });

  // 找到所有入度为0的任务
  const queue: string[] = [];
  inDegree.forEach((degree, taskId) => {
    if (degree === 0) queue.push(taskId);
  });

  // 处理队列
  while (queue.length > 0) {
    const taskId = queue.shift()!;
    sorted.push(taskId);

    // 减少所有后置任务的入度
    const succs = successors.get(taskId) || [];
    succs.forEach((link) => {
      const currentDegree = inDegree.get(link.target) || 0;
      inDegree.set(link.target, currentDegree - 1);

      if (currentDegree - 1 === 0) {
        queue.push(link.target);
      }
    });
  }

  // 如果排序后的任务数量不等于总任务数，说明存在环
  if (sorted.length !== tasks.length) {
    console.warn('拓扑排序失败：依赖关系中可能存在环');
    // 返回原始顺序作为后备方案
    return tasks.map((task) => task.id);
  }

  return sorted;
}

/**
 * 检查依赖关系是否有效
 */
export function validateDependencies(tasks: GanttTask[], links: TaskLink[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 检查任务是否存在
  links.forEach((link) => {
    const sourceExists = tasks.some((t) => t.id === link.source);
    const targetExists = tasks.some((t) => t.id === link.target);

    if (!sourceExists) {
      errors.push(`依赖关系中引用了不存在的源任务: ${link.source}`);
    }
    if (!targetExists) {
      errors.push(`依赖关系中引用了不存在的目标任务: ${link.target}`);
    }

    // 检查自依赖
    if (link.source === link.target) {
      errors.push(`任务不能依赖自身: ${link.source}`);
    }
  });

  // 检查循环依赖（简化检查）
  if (links.length > 0) {
    try {
      // 尝试进行拓扑排序，如果失败则可能存在环
      const predecessors = new Map<string, TaskLink[]>();
      const successors = new Map<string, TaskLink[]>();

      tasks.forEach((task) => {
        predecessors.set(task.id, []);
        successors.set(task.id, []);
      });

      links.forEach((link) => {
        if (link.type === '0') {
          const targetPreds = predecessors.get(link.target) || [];
          targetPreds.push(link);
          predecessors.set(link.target, targetPreds);

          const sourceSuccs = successors.get(link.source) || [];
          sourceSuccs.push(link);
          successors.set(link.source, sourceSuccs);
        }
      });

      topologicalSort(tasks, predecessors, successors);
    } catch (error) {
      errors.push('检测到循环依赖关系');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 获取关键路径可视化数据
 */
export function getCriticalPathVisualization(
  tasks: GanttTask[],
  links: TaskLink[]
) {
  const result = calculateCriticalPath(tasks, links);

  // 构建关键路径连接关系
  const criticalLinks: TaskLink[] = [];
  links.forEach((link) => {
    if (
      result.criticalTasks.includes(link.source) &&
      result.criticalTasks.includes(link.target)
    ) {
      // 检查是否在关键路径序列中连续
      const sourceIndex = result.criticalPath.indexOf(link.source);
      const targetIndex = result.criticalPath.indexOf(link.target);
      if (sourceIndex >= 0 && targetIndex >= 0 && targetIndex === sourceIndex + 1) {
        criticalLinks.push(link);
      }
    }
  });

  return {
    criticalTasks: result.criticalTasks,
    criticalPath: result.criticalPath,
    criticalLinks,
    projectDuration: result.projectDuration,
    tasksInfo: result.tasksInfo,
  };
}