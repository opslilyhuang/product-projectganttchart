/**
 * 甘特图任务类型定义
 */

export interface GanttTask {
  // 基础标识
  id: string;
  text: string;
  type: 'project' | 'task' | 'subtask';
  parent: string | null;

  // 时间相关
  start_date: string;
  end_date: string;
  duration: number;

  // 进度和状态
  progress: number; // 0-1
  status: 'planned' | 'in-progress' | 'completed' | 'blocked';

  // 业务属性
  owner: string;
  phase: 'H1' | 'H2' | 'custom';
  priority: 'low' | 'medium' | 'high';
  description?: string;

  // 甘特图特性
  is_milestone: boolean;
  color?: string;
  readonly?: boolean;
  open?: boolean; // 是否展开（针对父任务）

  // 排序和视图
  order?: number; // 排序字段，用于同父级任务间的顺序
  view?: 'project' | 'product'; // 视图类型：项目甘特图或产品甘特图
}

export interface TaskLink {
  id: string;
  source: string;
  target: string;
  type: '0' | '1' | '2' | '3'; // DHTMLX link types: 0=finish-to-start, 1=start-to-start, 2=finish-to-finish, 3=start-to-finish
}

export interface GanttConfig {
  view: 'day' | 'week' | 'month' | 'quarter';
  readonly: boolean;
  showProgress: boolean;
  showCriticalPath: boolean;
  searchQuery?: string; // 搜索关键词
}

export interface Resource {
  id: number;
  name: string;
  email?: string;
  role?: string;
  capacity: number; // 0-1，表示工作能力百分比
  user_id?: number;
}

export interface ResourceAssignment {
  id: number;
  task_id: string;
  resource_id: number;
  allocation: number; // 0-1，表示分配给该任务的时间百分比
}

export interface GanttData {
  tasks: GanttTask[];
  links: TaskLink[];
  config: GanttConfig;
  resources?: Resource[];
  resourceAssignments?: ResourceAssignment[];
}

export interface GanttStore {
  // 状态
  tasks: GanttTask[];
  links: TaskLink[];
  config: GanttConfig;
  selectedTask: GanttTask | null;
  resources: Resource[];
  resourceAssignments: ResourceAssignment[];
  activeView: 'project' | 'product'; // 当前活动视图
  searchQueries: Record<'project' | 'product', string>; // 各视图的搜索查询
  filterStatuses: Record<'project' | 'product', string[]>; // 各视图的筛选条件

  // 任务操作
  addTask: (task: Omit<GanttTask, 'id'>, view?: 'project' | 'product') => void;
  updateTask: (id: string, updates: Partial<GanttTask>) => void;
  deleteTask: (id: string) => void;

  // 依赖关系操作
  addLink: (link: Omit<TaskLink, 'id'>) => void;
  deleteLink: (id: string) => void;

  // 资源操作
  addResource: (resource: Omit<Resource, 'id'>) => void;
  updateResource: (id: number, updates: Partial<Resource>) => void;
  deleteResource: (id: number) => void;

  // 资源分配操作
  assignResource: (assignment: Omit<ResourceAssignment, 'id'>) => void;
  updateResourceAssignment: (id: number, updates: Partial<ResourceAssignment>) => void;
  removeResourceAssignment: (id: number) => void;
  removeResourceAssignmentByTaskAndResource: (taskId: string, resourceId: number) => void;

  // 选择操作
  setSelectedTask: (task: GanttTask | null) => void;

  // 配置操作
  setConfig: (config: Partial<GanttConfig>) => void;

  // 视图和搜索操作
  setActiveView: (view: 'project' | 'product') => void;
  setSearchQuery: (view: 'project' | 'product', query: string) => void;
  setFilterStatuses: (view: 'project' | 'product', statuses: string[]) => void;
  getTasksByView: (view: 'project' | 'product') => GanttTask[];
  getFilteredTasksByView: (view: 'project' | 'product') => GanttTask[]; // 根据搜索查询和筛选条件过滤的任务
  moveTaskUp: (taskId: string) => void;
  moveTaskDown: (taskId: string) => void;
  reorderTasks: (parentId: string | null, view: 'project' | 'product') => void;
  copyProjectToProduct: () => void; // 复制项目数据到产品

  // 数据操作
  loadInitialData: () => void;
  resetData: () => void;
  exportData: () => string;
  importData: (json: string) => void;
  migrateToAPI: () => Promise<boolean>;
  loadFromAPI: () => Promise<boolean>;
  saveState: () => void;
}

export type ViewMode = 'day' | 'week' | 'month' | 'quarter';
