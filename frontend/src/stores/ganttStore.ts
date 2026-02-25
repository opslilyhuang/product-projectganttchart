/**
 * Zustand 状态管理 - 甘特图数据存储（多视图版本）
 */

import { create } from 'zustand';
import type { GanttTask, TaskLink, GanttConfig, GanttStore } from '@/types/gantt';
import initialData from '@/data/initial-data.json';
import { validateGanttData } from '@/utils/dataConverter';
import api from '@/services/api';

// 存储版本控制
const STORAGE_VERSION = 3;
const STORAGE_KEY = 'gantt-storage-v3';

// 配置：是否使用后端API（true=使用API，false=使用localStorage）
const USE_API = true;

// 存储数据结构
interface StorageData {
  version: number;
  timestamp: string;
  projectTasks: GanttTask[];
  productTasks: GanttTask[];
  links: TaskLink[];
  config: GanttConfig;
  resources: any[];
  resourceAssignments: any[];
  searchQueries: Record<'project' | 'product', string>;
  filterStatuses: Record<'project' | 'product', string[]>;
}

// API辅助函数
const apiCall = {
  // 创建任务
  createTask: async (task: GanttTask): Promise<void> => {
    if (!USE_API) return;
    try {
      await api.post('/tasks', task);
      console.log('✅ 任务已保存到API:', task.id);
    } catch (error) {
      console.error('保存任务到API失败:', error);
      throw error;
    }
  },

  // 更新任务
  updateTask: async (id: string, updates: Partial<GanttTask>): Promise<void> => {
    if (!USE_API) return;
    try {
      await api.put(`/tasks/${id}`, updates);
      console.log('✅ 任务已更新到API:', id);
    } catch (error) {
      console.error('更新任务到API失败:', error);
      throw error;
    }
  },

  // 删除任务
  deleteTask: async (id: string): Promise<void> => {
    if (!USE_API) return;
    try {
      await api.delete(`/tasks/${id}`);
      console.log('✅ 任务已从API删除:', id);
    } catch (error) {
      console.error('从API删除任务失败:', error);
      throw error;
    }
  },

  // 创建链接
  createLink: async (_link: TaskLink): Promise<void> => {
    if (!USE_API) return;
    try {
      // 注意：后端可能需要单独的链接端点，这里使用任务端点作为示例
      // 暂时跳过链接API调用
      console.log('⚠️ 链接API调用暂未实现');
    } catch (error) {
      console.error('保存链接到API失败:', error);
    }
  },

  // 删除链接
  deleteLink: async (_id: string): Promise<void> => {
    if (!USE_API) return;
    try {
      // 暂时跳过链接API调用
      console.log('⚠️ 链接API调用暂未实现');
    } catch (error) {
      console.error('从API删除链接失败:', error);
    }
  },

  // 更新配置
  updateConfig: async (config: GanttConfig): Promise<void> => {
    if (!USE_API) return;
    try {
      await api.put('/config', config);
      console.log('✅ 配置已保存到API');
    } catch (error) {
      console.error('保存配置到API失败:', error);
    }
  },

  // 迁移数据到API
  migrateData: async (data: StorageData): Promise<void> => {
    if (!USE_API) return;
    try {
      const allTasks = [...data.projectTasks, ...data.productTasks];
      await api.post('/migrate-data', {
        tasks: allTasks,
        links: data.links,
        config: data.config
      });
      console.log('✅ 数据已迁移到API');
    } catch (error) {
      console.error('数据迁移到API失败:', error);
      throw error;
    }
  }
};

// 从API加载数据
// @ts-ignore
const loadFromAPI = async (): Promise<StorageData | null> => {
  if (!USE_API) {
    console.log('🔧 API模式已禁用，跳过API加载');
    return null;
  }

  try {
    console.log('=== 从API加载数据 ===');
    const response = await api.get('/tasks');
    console.log('API响应:', response);

    const tasks: GanttTask[] = response.tasks || [];
    const links: TaskLink[] = response.links || [];

    // 从API获取配置
    let config: GanttConfig;
    try {
      const configResponse = await api.get('/config');
      config = configResponse;
    } catch (error) {
      console.warn('获取配置失败，使用默认配置:', error);
      config = initialData.config as GanttConfig;
    }

    // 将任务按视图分类
    const projectTasks = tasks.filter(task => task.view === 'project');
    const productTasks = tasks.filter(task => task.view === 'product');

    console.log(`✅ 从API加载完成: ${tasks.length}个任务, ${links.length}个链接`);
    console.log(`项目任务: ${projectTasks.length}, 产品任务: ${productTasks.length}`);

    return {
      version: STORAGE_VERSION,
      timestamp: new Date().toISOString(),
      projectTasks,
      productTasks,
      links,
      config,
      resources: [], // API暂时不支持资源
      resourceAssignments: [], // API暂时不支持资源分配
      searchQueries: { project: '', product: '' },
      filterStatuses: { project: [], product: [] }
    };
  } catch (error) {
    console.error('从API加载数据失败:', error);
    // API失败时回退到localStorage
    console.log('⚠️ API加载失败，回退到localStorage');
    return null;
  }
};

// 从localStorage加载数据（支持版本迁移）
const loadFromStorage = (): StorageData | null => {
  try {
    // 尝试加载新版本数据
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (parsed.version === STORAGE_VERSION) {
        console.log('=== 从localStorage加载v3数据 ===');
        console.log('项目任务数量:', parsed.projectTasks?.length || 0);
        console.log('产品任务数量:', parsed.productTasks?.length || 0);
        return parsed;
      }
    }

    // 尝试加载v2数据并迁移到v3
    const v2Data = localStorage.getItem('gantt-storage-v2');
    if (v2Data) {
      console.log('=== 检测到v2数据，开始迁移到v3 ===');
      const parsed = JSON.parse(v2Data);
      if (parsed.version === 2) {
        // 从初始数据获取产品任务（包含新任务）
        const initialProductTasks = (initialData.tasks as GanttTask[]).filter(task => task.view === 'product');

        const migratedData: StorageData = {
          version: STORAGE_VERSION,
          timestamp: new Date().toISOString(),
          projectTasks: parsed.projectTasks || [],
          productTasks: initialProductTasks, // 使用初始数据中的产品任务
          links: parsed.links || [],
          config: parsed.config || initialData.config,
          resources: parsed.resources || [],
          resourceAssignments: parsed.resourceAssignments || [],
          searchQueries: parsed.searchQueries || { project: '', product: '' },
          filterStatuses: parsed.filterStatuses || { project: [], product: [] }
        };

        // 保存迁移后的数据
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedData));
        console.log('✅ v2数据迁移到v3完成');
        return migratedData;
      }
    }

    // 尝试加载旧版本数据并迁移
    const oldData = localStorage.getItem('gantt-storage');
    if (oldData) {
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
        config: parsed.config || initialData.config,
        resources: parsed.resources || [],
        resourceAssignments: parsed.resourceAssignments || [],
        searchQueries: { project: '', product: '' },
        filterStatuses: { project: [], product: [] }
      };

      // 保存迁移后的数据
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedData));
      console.log('✅ 数据迁移完成');
      return migratedData;
    }
  } catch (error) {
    console.error('加载localStorage数据失败:', error);
  }

  console.log('=== 使用初始数据 ===');
  return null;
};

// 保存数据到localStorage
const saveToStorage = (data: StorageData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('保存数据到localStorage失败:', error);
  }
};

// 初始化任务排序
const initializeTaskOrders = (tasks: GanttTask[]): GanttTask[] => {
  // 按父级分组
  const tasksByParent = new Map<string | null, GanttTask[]>();

  tasks.forEach(task => {
    const parentId = task.parent;
    if (!tasksByParent.has(parentId)) {
      tasksByParent.set(parentId, []);
    }
    tasksByParent.get(parentId)!.push(task);
  });

  // 为每组分配order值
  const updatedTasks = [...tasks];
  tasksByParent.forEach((siblings, _parentId) => {
    // 按开始时间排序（如果没有order字段）
    siblings.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    });

    // 分配连续的order值
    siblings.forEach((task, index) => {
      const taskIndex = updatedTasks.findIndex(t => t.id === task.id);
      if (taskIndex !== -1) {
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          order: index
        };
      }
    });
  });

  return updatedTasks;
};

// 初始化数据 - 优先从API加载
const initializeData = async (): Promise<StorageData> => {
  console.log('=== 初始化数据加载 ===');

  // 1. 首先尝试从API加载（如果启用）
  if (USE_API) {
    try {
      const apiData = await loadFromAPI();
      if (apiData) {
        console.log('✅ 成功从API加载数据');
        saveToStorage(apiData); // 缓存到localStorage
        return apiData;
      }
    } catch (error) {
      console.warn('⚠️ API加载失败，尝试从localStorage加载:', error);
    }
  }

  // 2. 回退到localStorage
  const savedState = loadFromStorage();
  if (savedState) {
    console.log('✅ 从localStorage加载数据');
    return savedState;
  }

  // 3. 使用初始数据
  console.log('✅ 使用初始数据');
  return {
    version: STORAGE_VERSION,
    timestamp: new Date().toISOString(),
    projectTasks: (initialData.tasks as GanttTask[]).filter(task => task.view === 'project'),
    productTasks: (initialData.tasks as GanttTask[]).filter(task => task.view === 'product'),
    links: initialData.links as TaskLink[],
    config: initialData.config as GanttConfig,
    resources: [],
    resourceAssignments: [],
    searchQueries: { project: '', product: '' },
    filterStatuses: { project: [], product: [] }
  };
};

// 同步加载localStorage用于初始化（兼容性）
const savedState = loadFromStorage();

// 计算最终任务列表
let finalTasks: GanttTask[];
let finalProjectTasks: GanttTask[] = [];
let finalProductTasks: GanttTask[] = [];

if (savedState) {
  finalProjectTasks = savedState.projectTasks || [];
  finalProductTasks = savedState.productTasks || [];
  finalTasks = [...finalProjectTasks, ...finalProductTasks];
} else {
  // 使用初始数据
  finalTasks = initialData.tasks as GanttTask[];
  finalProjectTasks = finalTasks.filter(task => task.view === 'project');
  finalProductTasks = finalTasks.filter(task => task.view === 'product');
}

export const useGanttStore = create<GanttStore>()((set, get) => ({
  // 初始状态
  tasks: finalTasks,
  links: savedState?.links || (initialData.links as TaskLink[]),
  config: savedState?.config || (initialData.config as GanttConfig),
  selectedTask: null,
  resources: savedState?.resources || [],
  resourceAssignments: savedState?.resourceAssignments || [],
  activeView: 'project',
  searchQueries: savedState?.searchQueries || { project: '', product: '' },
  // 任务筛选条件
  filterStatuses: savedState?.filterStatuses || { project: [], product: [] },

  // 任务操作
  addTask: (taskData, view = get().activeView) => {
    const newTask: GanttTask = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: 0, // 默认order，会在reorderTasks中调整
      view,
    } as GanttTask;

    set((state) => ({
      tasks: [...state.tasks, newTask],
    }));

    // 为新任务所在组重新排序
    setTimeout(() => {
      get().reorderTasks(newTask.parent, view);
    }, 0);

    // 立即保存到localStorage
    get().saveState();

    // 异步保存到API
    if (USE_API) {
      (async () => {
        try {
          await apiCall.createTask(newTask);
        } catch (error) {
          console.error('保存任务到API失败，但已保存到本地:', error);
        }
      })();
    }
  },

  updateTask: (id, updates) => {
    console.log('Store - updateTask called, id:', id, 'updates:', updates);
    set((state) => {
      const updatedTasks = state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      );
      console.log('Store - Updated tasks count:', updatedTasks.length);
      return { tasks: updatedTasks };
    });

    // 如果更新的是当前选中的任务，也更新 selectedTask
    const currentSelected = get().selectedTask;
    if (currentSelected && currentSelected.id === id) {
      set({ selectedTask: { ...currentSelected, ...updates } });
    }

    // 立即保存到localStorage
    get().saveState();

    // 异步保存到API
    if (USE_API) {
      (async () => {
        try {
          await apiCall.updateTask(id, updates);
        } catch (error) {
          console.error('更新任务到API失败，但已保存到本地:', error);
        }
      })();
    }
  },

  deleteTask: (id) => {
    console.log('🗑️ Store - deleteTask called, id:', id);
    const taskToDelete = get().tasks.find(t => t.id === id);
    const view = taskToDelete?.view || 'project';
    let tasksToDelete: Set<string> = new Set();

    set((state) => {
      // 删除任务及其所有子任务
      tasksToDelete = new Set([id]);
      const findChildren = (parentId: string) => {
        state.tasks.forEach((task) => {
          if (task.parent === parentId) {
            tasksToDelete.add(task.id);
            findChildren(task.id);
          }
        });
      };
      findChildren(id);

      console.log(`📋 将删除 ${tasksToDelete.size} 个任务:`, Array.from(tasksToDelete));

      return {
        tasks: state.tasks.filter((task) => !tasksToDelete.has(task.id)),
        links: state.links.filter(
          (link) => !tasksToDelete.has(link.source) && !tasksToDelete.has(link.target)
        ),
        selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
      };
    });

    // 重新排序删除任务所在组
    setTimeout(() => {
      get().reorderTasks(taskToDelete?.parent || null, view);
    }, 0);

    // 立即保存到localStorage
    get().saveState();

    // 异步从API删除
    if (USE_API && tasksToDelete) {
      (async () => {
        try {
          for (const taskId of tasksToDelete) {
            await apiCall.deleteTask(taskId);
          }
        } catch (error) {
          console.error('从API删除任务失败，但已从本地删除:', error);
        }
      })();
    }
  },

  // 依赖关系操作
  addLink: (link) => {
    const newLink: TaskLink = {
      ...link,
      id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    set((state) => ({
      links: [...state.links, newLink],
    }));

    get().saveState();

    // 异步保存到API
    if (USE_API) {
      (async () => {
        try {
          await apiCall.createLink(newLink);
        } catch (error) {
          console.error('保存链接到API失败，但已保存到本地:', error);
        }
      })();
    }
  },

  deleteLink: (id) => {
    set((state) => ({
      links: state.links.filter((link) => link.id !== id),
    }));

    get().saveState();

    // 异步从API删除
    if (USE_API) {
      (async () => {
        try {
          await apiCall.deleteLink(id);
        } catch (error) {
          console.error('从API删除链接失败，但已从本地删除:', error);
        }
      })();
    }
  },

  // 资源操作
  addResource: (resource) => {
    const newResource = {
      ...resource,
      id: Math.max(0, ...get().resources.map(r => r.id)) + 1,
    };
    set((state) => ({
      resources: [...state.resources, newResource],
    }));

    get().saveState();
  },

  updateResource: (id, updates) => {
    set((state) => ({
      resources: state.resources.map((resource) =>
        resource.id === id ? { ...resource, ...updates } : resource
      ),
    }));

    get().saveState();
  },

  deleteResource: (id) => {
    set((state) => ({
      resources: state.resources.filter((resource) => resource.id !== id),
      resourceAssignments: state.resourceAssignments.filter(
        (assignment) => assignment.resource_id !== id
      ),
    }));

    get().saveState();
  },

  // 资源分配操作
  assignResource: (assignment) => {
    const newAssignment = {
      ...assignment,
      id: Math.max(0, ...get().resourceAssignments.map(a => a.id)) + 1,
    };
    set((state) => ({
      resourceAssignments: [...state.resourceAssignments, newAssignment],
    }));

    get().saveState();
  },

  updateResourceAssignment: (id, updates) => {
    set((state) => ({
      resourceAssignments: state.resourceAssignments.map((assignment) =>
        assignment.id === id ? { ...assignment, ...updates } : assignment
      ),
    }));

    get().saveState();
  },

  removeResourceAssignment: (id) => {
    set((state) => ({
      resourceAssignments: state.resourceAssignments.filter(
        (assignment) => assignment.id !== id
      ),
    }));

    get().saveState();
  },

  removeResourceAssignmentByTaskAndResource: (taskId, resourceId) => {
    set((state) => ({
      resourceAssignments: state.resourceAssignments.filter(
        (assignment) =>
          !(assignment.task_id === taskId && assignment.resource_id === resourceId)
      ),
    }));

    get().saveState();
  },

  // 选择操作
  setSelectedTask: (task) => {
    set({ selectedTask: task });
  },

  // 配置操作
  setConfig: (config) => {
    set((state) => ({
      config: { ...state.config, ...config },
    }));

    get().saveState();

    // 异步保存到API
    if (USE_API) {
      (async () => {
        try {
          await apiCall.updateConfig(config as GanttConfig);
        } catch (error) {
          console.error('保存配置到API失败，但已保存到本地:', error);
        }
      })();
    }
  },

  // 视图操作
  setActiveView: (view) => {
    set({ activeView: view });
  },

  setSearchQuery: (view, query) => {
    set((state) => ({
      searchQueries: {
        ...state.searchQueries,
        [view]: query
      }
    }));
  },

  setFilterStatuses: (view, statuses) => {
    set((state) => ({
      filterStatuses: {
        ...state.filterStatuses,
        [view]: statuses
      }
    }));
  },

  getTasksByView: (view) => {
    return get().tasks.filter(task => task.view === view);
  },

  getFilteredTasksByView: (view) => {
    const state = get();
    const tasks = state.tasks.filter(task => task.view === view);
    const searchQuery = state.searchQueries[view]?.toLowerCase() || '';
    const selectedFilters = state.filterStatuses[view] || [];

    // 搜索过滤
    let filteredTasks = tasks;
    if (searchQuery.trim()) {
      filteredTasks = tasks.filter(task => {
        const textMatch = task.text?.toLowerCase().includes(searchQuery);
        const ownerMatch = task.owner?.toLowerCase().includes(searchQuery);
        return textMatch || ownerMatch;
      });
    }

    // 状态筛选过滤
    if (selectedFilters.length > 0) {
      filteredTasks = filteredTasks.filter(task => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskEndDate = new Date(task.end_date);
        taskEndDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.ceil((taskEndDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        const isCompleted = task.status === 'completed' || task.progress >= 1;

        return selectedFilters.some(filter => {
          switch (filter) {
            case 'completed':
              return isCompleted;
            case 'in-progress':
              return task.status === 'in-progress' && !isCompleted && daysDiff >= 0;
            case 'overdue':
              return !isCompleted && daysDiff < 0;
            case 'planned':
              return task.status === 'planned' && !isCompleted && daysDiff >= 0;
            case 'milestone':
              return task.is_milestone;
            default:
              return false;
          }
        });
      });
    }

    return filteredTasks;
  },

  moveTaskUp: (taskId) => {
    console.log('🔄 moveTaskUp called, taskId:', taskId);
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) {
      console.log('❌ 任务未找到:', taskId);
      return;
    }

    const view = task.view || 'project';
    console.log('📊 任务信息:', { id: task.id, text: task.text, parent: task.parent, view, order: task.order });

    // 获取所有兄弟任务（包括当前任务）
    const allSiblings = get().tasks.filter(t =>
      t.parent === task.parent &&
      t.view === view
    ).sort((a, b) => (a.order || 0) - (b.order || 0));

    console.log('👥 所有兄弟任务数量:', allSiblings.length);
    console.log('👥 所有兄弟任务:', allSiblings.map(s => ({ id: s.id, text: s.text, order: s.order })));

    // 找到当前任务在兄弟任务中的位置
    const currentIndex = allSiblings.findIndex(t => t.id === taskId);
    console.log('📈 当前任务在兄弟中的位置:', currentIndex);
    if (currentIndex <= 0) {
      console.log('⛔ 已经是第一个，无法上移');
      return; // 已经是第一个，无法上移
    }

    // 与上一个兄弟交换order
    const prevTask = allSiblings[currentIndex - 1];
    const tempOrder = task.order;
    console.log('🔄 交换order: 当前任务order', tempOrder, '上一个任务order', prevTask.order);

    set((state) => ({
      tasks: state.tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, order: prevTask.order || 0 };
        }
        if (t.id === prevTask.id) {
          return { ...t, order: tempOrder || 0 };
        }
        return t;
      })
    }));

    console.log('✅ order交换完成');

    // 重新排序以确保order值连续
    setTimeout(() => {
      get().reorderTasks(task.parent, view);
    }, 0);
  },

  moveTaskDown: (taskId) => {
    console.log('🔄 moveTaskDown called, taskId:', taskId);
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) {
      console.log('❌ 任务未找到:', taskId);
      return;
    }

    const view = task.view || 'project';
    console.log('📊 任务信息:', { id: task.id, text: task.text, parent: task.parent, view, order: task.order });

    // 获取所有兄弟任务（包括当前任务）
    const allSiblings = get().tasks.filter(t =>
      t.parent === task.parent &&
      t.view === view
    ).sort((a, b) => (a.order || 0) - (b.order || 0));

    console.log('👥 所有兄弟任务数量:', allSiblings.length);
    console.log('👥 所有兄弟任务:', allSiblings.map(s => ({ id: s.id, text: s.text, order: s.order })));

    // 找到当前任务在兄弟任务中的位置
    const currentIndex = allSiblings.findIndex(t => t.id === taskId);
    console.log('📈 当前任务在兄弟中的位置:', currentIndex);
    if (currentIndex === -1 || currentIndex >= allSiblings.length - 1) {
      console.log('⛔ 已经是最后一个，无法下移');
      return; // 已经是最后一个，无法下移
    }

    // 与下一个兄弟交换order
    const nextTask = allSiblings[currentIndex + 1];
    const tempOrder = task.order;
    console.log('🔄 交换order: 当前任务order', tempOrder, '下一个任务order', nextTask.order);

    set((state) => ({
      tasks: state.tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, order: nextTask.order || 0 };
        }
        if (t.id === nextTask.id) {
          return { ...t, order: tempOrder || 0 };
        }
        return t;
      })
    }));

    console.log('✅ order交换完成');

    // 重新排序以确保order值连续
    setTimeout(() => {
      get().reorderTasks(task.parent, view);
    }, 0);
  },

  reorderTasks: (parentId, view) => {
    set((state) => {
      // 获取指定父级和视图的所有任务
      const siblings = state.tasks.filter(t =>
        t.parent === parentId &&
        (t.view === view || (!t.view && view === 'project'))
      );

      // 按当前order排序
      const sortedSiblings = [...siblings].sort((a, b) => (a.order || 0) - (b.order || 0));

      // 重新分配连续的order值
      const updatedTasks = state.tasks.map(task => {
        const siblingIndex = sortedSiblings.findIndex(t => t.id === task.id);
        if (siblingIndex !== -1) {
          return { ...task, order: siblingIndex };
        }
        return task;
      });

      return { tasks: updatedTasks };
    });

    get().saveState();
  },

  // 数据操作
  loadInitialData: () => {
    // 初始化任务排序
    const tasksWithOrder = initializeTaskOrders(initialData.tasks as GanttTask[]);
    const tasksWithView = tasksWithOrder.map(task => ({
      ...task,
      view: task.view || 'project' as const
    }));

    set({
      tasks: tasksWithView,
      links: initialData.links as TaskLink[],
      config: initialData.config as GanttConfig,
      selectedTask: null,
      activeView: 'project',
    });

    get().saveState();
  },

  resetData: () => {
    get().loadInitialData();
  },

  exportData: () => {
    const { tasks, links, config } = get();
    return JSON.stringify({ tasks, links, config }, null, 2);
  },

  importData: (json) => {
    try {
      const data = JSON.parse(json);
      if (validateGanttData(data)) {
        // 初始化导入数据的排序和视图
        const tasksWithOrder = initializeTaskOrders(data.tasks);
        const tasksWithView = tasksWithOrder.map(task => ({
          ...task,
          view: task.view || 'project'
        }));

        set({
          tasks: tasksWithView,
          links: data.links,
          config: data.config,
          selectedTask: null,
        });

        get().saveState();
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      console.error('Failed to import data:', error);
      alert('导入失败：数据格式不正确');
    }
  },

  copyProjectToProduct: () => {
    console.log('📋 复制项目数据到产品数据');
    const state = get();

    // 获取项目任务和链接
    const projectTasks = state.tasks.filter(t => t.view === 'project');
    const projectLinks = state.links;

    if (projectTasks.length === 0) {
      console.log('⚠️ 项目数据为空，无法复制');
      return;
    }

    // 创建ID映射表：原ID -> 新ID
    const idMap = new Map<string, string>();

    // 第一步：为所有项目任务生成新ID
    projectTasks.forEach(task => {
      const newId = `${task.id}-product-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      idMap.set(task.id, newId);
    });

    // 第二步：复制任务，使用新ID，设置view为'product'，更新parent引用
    const productTasks = projectTasks.map(task => {
      const newId = idMap.get(task.id)!;
      const newParent = task.parent && idMap.has(task.parent) ? idMap.get(task.parent)! : task.parent;

      return {
        ...task,
        id: newId,
        view: 'product' as const,
        parent: newParent
      };
    });

    // 第三步：复制链接，更新source和target指向新ID
    const productLinks = projectLinks.map(link => {
      const newSource = idMap.get(link.source) || link.source;
      const newTarget = idMap.get(link.target) || link.target;

      return {
        ...link,
        id: `${link.id}-product-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        source: newSource,
        target: newTarget
      };
    });

    // 合并到现有数据中
    set({
      tasks: [...state.tasks, ...productTasks],
      links: [...state.links, ...productLinks]
    });

    console.log(`✅ 复制完成：${productTasks.length}个任务，${productLinks.length}个链接`);
    get().saveState();
  },

  // 数据迁移
  migrateToAPI: async () => {
    if (!USE_API) {
      console.log('🔧 API模式已禁用，跳过数据迁移');
      return false;
    }

    try {
      console.log('=== 开始迁移数据到API ===');
      const state = get();
      const projectTasks = state.tasks.filter(t => t.view === 'project');
      const productTasks = state.tasks.filter(t => t.view === 'product');

      const storageData: StorageData = {
        version: STORAGE_VERSION,
        timestamp: new Date().toISOString(),
        projectTasks,
        productTasks,
        links: state.links,
        config: state.config,
        resources: state.resources,
        resourceAssignments: state.resourceAssignments,
        searchQueries: state.searchQueries,
        filterStatuses: state.filterStatuses,
      };

      await apiCall.migrateData(storageData);
      console.log('✅ 数据迁移到API完成');
      return true;
    } catch (error) {
      console.error('数据迁移到API失败:', error);
      return false;
    }
  },

  // 从API加载数据
  loadFromAPI: async () => {
    if (!USE_API) {
      console.log('🔧 API模式已禁用，跳过API加载');
      return false;
    }

    try {
      console.log('=== 从API加载数据 ===');
      const response = await api.get('/tasks');
      console.log('API响应:', response);

      const tasks: GanttTask[] = response.tasks || [];
      const links: TaskLink[] = response.links || [];

      // 从API获取配置
      let config: GanttConfig;
      try {
        const configResponse = await api.get('/config');
        config = configResponse;
      } catch (error) {
        console.warn('获取配置失败，使用默认配置:', error);
        config = initialData.config as GanttConfig;
      }

      // 初始化任务排序
      const tasksWithOrder = initializeTaskOrders(tasks);
      const tasksWithView = tasksWithOrder.map(task => ({
        ...task,
        view: task.view || 'project' as const
      }));

      set({
        tasks: tasksWithView,
        links,
        config,
        selectedTask: null,
      });

      console.log(`✅ 从API加载完成: ${tasks.length}个任务, ${links.length}个链接`);
      return true;
    } catch (error) {
      console.error('从API加载数据失败:', error);
      return false;
    }
  },

  // 内部保存方法
  saveState: () => {
    setTimeout(() => {
      const state = get();
      const projectTasks = state.tasks.filter(t => t.view === 'project');
      const productTasks = state.tasks.filter(t => t.view === 'product');

      const storageData: StorageData = {
        version: STORAGE_VERSION,
        timestamp: new Date().toISOString(),
        projectTasks,
        productTasks,
        links: state.links,
        config: state.config,
        resources: state.resources,
        resourceAssignments: state.resourceAssignments,
        searchQueries: state.searchQueries,
        filterStatuses: state.filterStatuses,
      };

      saveToStorage(storageData);
      console.log('✅ 自动保存完成');
      console.log(`项目任务: ${projectTasks.length}, 产品任务: ${productTasks.length}`);
    }, 0);
  },
}));