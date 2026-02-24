/**
 * 甘特图工具栏组件 - 增强版
 */

import { useState, useEffect } from 'react';
import { Plus, Download, Upload, RotateCcw, Calendar, FileImage, FileText, Printer, ChevronDown, Activity, Zap, CalendarDays, Save, CheckCircle, Search, X, Database, Cloud, Filter, CheckSquare, Square } from 'lucide-react';
import { useGanttStore } from '@/stores/ganttStore';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';
import { exportToPNG, exportToPDF, printGantt } from '@/utils/exportHelpers';
import { exportToCalendar } from '@/utils/calendarExporter';
import type { ViewMode } from '@/types/gantt';

interface GanttToolbarProps {
  onAddTask: () => void;
  viewType?: 'project' | 'product'; // 当前视图类型
}

export default function GanttToolbar({ onAddTask, viewType = 'project' }: GanttToolbarProps) {
  const { config, setConfig, exportData, importData, resetData, tasks, setSearchQuery, searchQueries, migrateToAPI, filterStatuses, setFilterStatuses } = useGanttStore();
  const { user, isAuthenticated } = useAuthStore();
  const [currentView, setCurrentView] = useState<ViewMode>(config.view);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQueries[viewType] || '');
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // 筛选选项定义
  const filterOptions = [
    { value: 'completed', label: '已完成', color: 'bg-green-500' },
    { value: 'in-progress', label: '进行中未延期', color: 'bg-blue-500' },
    { value: 'overdue', label: '延期', color: 'bg-red-500' },
    { value: 'planned', label: '待开始', color: 'bg-gray-700' },
    { value: 'milestone', label: '里程碑节点', color: 'bg-yellow-500' },
  ];

  const currentFilters = filterStatuses[viewType] || [];

  // 读取migrationResult以消除TypeScript警告
  console.log(migrationResult);
  useEffect(() => {
    setSearchInput(searchQueries[viewType] || '');
  }, [viewType, searchQueries]);

  const handleMigrate = async () => {
    if (!isAuthenticated || !user) {
      alert('请先登录才能迁移数据到云端');
      return;
    }

    if (tasks.length === 0) {
      alert('没有数据可以迁移');
      return;
    }

    if (!confirm(`确定要将 ${tasks.length} 个任务迁移到云端数据库吗？\n\n迁移后数据将存储在云端，支持多用户访问。`)) {
      return;
    }

    setMigrating(true);
    setMigrationResult(null);

    try {
      console.log('开始迁移数据到API...');
      const success = await migrateToAPI();

      if (success) {
        setMigrationResult({ success: true, message: `✅ 数据迁移成功！已迁移 ${tasks.length} 个任务到云端。` });
        alert(`数据迁移成功！\n\n已迁移 ${tasks.length} 个任务到云端数据库。\n现在所有用户都可以访问这些数据。`);
      } else {
        setMigrationResult({ success: false, message: '❌ 数据迁移失败，请检查网络连接或联系管理员。' });
        alert('数据迁移失败，请检查网络连接或联系管理员。');
      }
    } catch (error) {
      console.error('数据迁移错误:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMigrationResult({ success: false, message: `❌ 数据迁移错误: ${errorMessage}` });
      alert(`数据迁移错误: ${errorMessage}`);
    } finally {
      setMigrating(false);
      setTimeout(() => setMigrationResult(null), 5000);
    }
  };

  const handleViewChange = (view: ViewMode) => {
    setCurrentView(view);
    setConfig({ view });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    setSearchQuery(viewType, value);
  };

  const handleSearchClear = () => {
    setSearchInput('');
    setSearchQuery(viewType, '');
  };

  const toggleFilter = (filterValue: string) => {
    const currentFilters = filterStatuses[viewType] || [];
    const newFilters = currentFilters.includes(filterValue)
      ? currentFilters.filter(f => f !== filterValue)
      : [...currentFilters, filterValue];
    setFilterStatuses(viewType, newFilters);
  };

  const handleSave = () => {
    // 手动触发保存到localStorage - 使用简化格式
    const data = exportData();
    const parsedData = JSON.parse(data);

    // 直接保存，不包装在state和version中
    localStorage.setItem('gantt-storage', JSON.stringify(parsedData));

    console.log('=== 手动保存操作 ===');
    console.log('当前任务数量:', tasks.length);
    console.log('保存的数据:', parsedData);
    console.log('✅ 已强制保存到localStorage');

    // 显示保存成功提示
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleExportJSON = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gantt-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportPNG = async () => {
    setShowExportMenu(false);
    await exportToPNG();
  };

  const handleExportPDF = async () => {
    setShowExportMenu(false);
    await exportToPDF();
  };

  const handlePrint = () => {
    setShowExportMenu(false);
    printGantt();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const json = event.target?.result as string;
          importData(json);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleReset = () => {
    if (confirm('确定要重置为初始数据吗？当前的所有修改将丢失。')) {
      resetData();
      window.location.reload();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 左侧：视图切换和搜索 */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 mr-2">视图:</span>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            {(['day', 'week', 'month', 'quarter'] as ViewMode[]).map((view) => (
              <button
                key={view}
                onClick={() => handleViewChange(view)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  currentView === view
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {view === 'day' && '日'}
                {view === 'week' && '周'}
                {view === 'month' && '月'}
                {view === 'quarter' && '季度'}
              </button>
            ))}
          </div>

          {/* 搜索框 */}
          <div className="relative ml-4">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder={`搜索${viewType === 'project' ? '项目' : '产品'}任务名称或负责人...`}
                className="pl-10 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              {searchInput && (
                <button
                  onClick={handleSearchClear}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="清除搜索"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 筛选按钮 */}
          <div className="relative ml-2">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                currentFilters.length > 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="筛选任务"
            >
              <Filter className="w-4 h-4" />
              筛选
              {currentFilters.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                  {currentFilters.length}
                </span>
              )}
            </button>

            {showFilterMenu && (
              <>
                {/* 遮罩层 */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowFilterMenu(false)}
                />

                {/* 下拉菜单 */}
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-3 z-20">
                  <div className="px-3 py-2 border-b border-gray-200 mb-2">
                    <div className="text-sm font-semibold text-gray-700">任务状态筛选</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {currentFilters.length === 0 ? '未选择筛选条件' : `已选择 ${currentFilters.length} 个条件`}
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filterOptions.map((option) => {
                      const isSelected = currentFilters.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() => toggleFilter(option.value)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <span className={`w-4 h-4 rounded ${option.color} flex-shrink-0`}></span>
                          <span className="flex-1">{option.label}</span>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {currentFilters.length > 0 && (
                    <>
                      <div className="border-t border-gray-200 mt-2 pt-2 px-3">
                        <button
                          onClick={() => setFilterStatuses(viewType, [])}
                          className="w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center justify-center gap-2"
                        >
                          <X className="w-3 h-3" />
                          清除筛选
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 中间：高级功能 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfig({ showCriticalPath: !config.showCriticalPath })}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              config.showCriticalPath
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="显示/隐藏关键路径"
          >
            <Zap className={`w-4 h-4 ${config.showCriticalPath ? 'text-white' : 'text-gray-600'}`} />
            关键路径 {config.showCriticalPath ? '开' : '关'}
          </button>

          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            title="查看关键路径详情"
            onClick={() => alert('关键路径详情功能正在开发中...')}
          >
            <Activity className="w-4 h-4 text-gray-600" />
            路径分析
          </button>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2">
          {/* 保存按钮 - 醒目样式 */}
          <div className="relative">
            <Button
              onClick={handleSave}
              className={`${
                showSaveSuccess
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              } text-white font-semibold shadow-lg transition-all`}
              size="sm"
            >
              {showSaveSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  已保存
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  保存数据
                </>
              )}
            </Button>
            {showSaveSuccess && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-green-600 text-white text-xs px-3 py-1 rounded shadow-lg">
                数据已保存到本地
              </div>
            )}
          </div>

          <Button onClick={onAddTask} variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            添加任务
          </Button>

          {/* 导出菜单 */}
          <div className="relative">
            <Button
              onClick={() => setShowExportMenu(!showExportMenu)}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-1" />
              导出
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>

            {showExportMenu && (
              <>
                {/* 遮罩层 */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />

                {/* 下拉菜单 */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <button
                    onClick={handleExportJSON}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-blue-500" />
                    导出为 JSON
                  </button>
                  <button
                    onClick={handleExportPNG}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FileImage className="w-4 h-4 text-green-500" />
                    导出为 PNG
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-red-500" />
                    导出为 PDF
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    onClick={handlePrint}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4 text-gray-500" />
                    打印
                  </button>
                </div>
              </>
            )}
          </div>

          <Button onClick={handleImport} variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-1" />
            导入
          </Button>

          {isAuthenticated && (
            <Button
              onClick={handleMigrate}
              variant="outline"
              size="sm"
              disabled={migrating}
              title={migrating ? '数据迁移中...' : '将本地数据迁移到云端数据库'}
              className={migrating ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {migrating ? (
                <>
                  <Cloud className="w-4 h-4 mr-1 animate-spin" />
                  迁移中...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-1" />
                  迁移到云端
                </>
              )}
            </Button>
          )}

          <Button
            onClick={() => exportToCalendar(tasks, 'AI项目甘特图')}
            variant="outline"
            size="sm"
            title="导出到日历 (ICS格式)"
          >
            <CalendarDays className="w-4 h-4 mr-1" />
            导出到日历
          </Button>

          <Button onClick={handleReset} variant="secondary" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            重置
          </Button>
        </div>
      </div>
    </div>
  );
}
