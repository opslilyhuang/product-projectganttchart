/**
 * LocalStorage 封装工具（多视图版本）
 */

import type { GanttData, GanttTask } from '@/types/gantt';

const STORAGE_KEY = 'gantt-storage-v2';
const STORAGE_VERSION = 2;

interface StorageData {
  version: number;
  timestamp: string;
  projectTasks: GanttTask[];
  productTasks: GanttTask[];
  links: GanttData['links'];
  config: GanttData['config'];
  resources?: GanttData['resources'];
  resourceAssignments?: GanttData['resourceAssignments'];
}

// 迁移旧版本数据
function migrateOldData(): StorageData | null {
  try {
    const oldData = localStorage.getItem('gantt-storage');
    if (!oldData) return null;

    console.log('=== 检测到旧版本数据，开始迁移 ===');
    const parsed = JSON.parse(oldData);

    // 迁移逻辑：将所有旧任务标记为项目视图
    const migratedProjectTasks = (parsed.tasks || []).map((task: GanttTask, index: number) => ({
      ...task,
      order: task.order || index,
      view: 'project' as const
    }));

    const migratedData: StorageData = {
      version: STORAGE_VERSION,
      timestamp: new Date().toISOString(),
      projectTasks: migratedProjectTasks,
      productTasks: [],
      links: parsed.links || [],
      config: parsed.config || { view: 'month', readonly: false, showProgress: true, showCriticalPath: false },
      resources: parsed.resources || [],
      resourceAssignments: parsed.resourceAssignments || []
    };

    // 保存迁移后的数据
    saveToLocalStorageV2(migratedData);
    console.log('✅ 数据迁移完成');
    return migratedData;
  } catch (error) {
    console.error('数据迁移失败:', error);
    return null;
  }
}

export function saveToLocalStorage(data: GanttData): void {
  try {
    const storageData: StorageData = {
      version: STORAGE_VERSION,
      timestamp: new Date().toISOString(),
      projectTasks: data.tasks.filter(t => t.view === 'project'),
      productTasks: data.tasks.filter(t => t.view === 'product'),
      links: data.links,
      config: data.config,
      resources: data.resources || [],
      resourceAssignments: data.resourceAssignments || []
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

// 新版本保存函数
export function saveToLocalStorageV2(data: StorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage v2:', error);
  }
}

export function loadFromLocalStorage(): GanttData | null {
  try {
    // 尝试加载新版本数据
    const item = localStorage.getItem(STORAGE_KEY);
    if (item) {
      const storageData: StorageData = JSON.parse(item);

      // 版本检查
      if (storageData.version === STORAGE_VERSION) {
        console.log('=== 从localStorage加载v2数据 ===');
        console.log('项目任务数量:', storageData.projectTasks?.length || 0);
        console.log('产品任务数量:', storageData.productTasks?.length || 0);

        return {
          tasks: [...storageData.projectTasks, ...storageData.productTasks],
          links: storageData.links,
          config: storageData.config,
          resources: storageData.resources,
          resourceAssignments: storageData.resourceAssignments
        };
      }
    }

    // 尝试迁移旧数据
    const migratedData = migrateOldData();
    if (migratedData) {
      return {
        tasks: [...migratedData.projectTasks, ...migratedData.productTasks],
        links: migratedData.links,
        config: migratedData.config,
        resources: migratedData.resources,
        resourceAssignments: migratedData.resourceAssignments
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}

export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('gantt-storage'); // 清理旧版本数据
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

export function hasStoredData(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null || localStorage.getItem('gantt-storage') !== null;
}

// 获取存储数据版本
export function getStorageVersion(): number {
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) {
      // 检查是否有旧版本数据
      return localStorage.getItem('gantt-storage') ? 1 : 0;
    }
    const storageData: StorageData = JSON.parse(item);
    return storageData.version || 0;
  } catch (error) {
    console.error('Failed to get storage version:', error);
    return 0;
  }
}
