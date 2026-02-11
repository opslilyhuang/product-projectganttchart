const fs = require('fs');
const path = require('path');

// 读取现有数据
const filePath = path.join(__dirname, 'initial-data.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(rawData);

// 模块映射：用户提供的模块ID -> 实际模块ID
const moduleMap = {
  'ai-customer-service': 'module-1-product',
  'product-recommendation': 'module-7-product',
  'order-tracking': 'module-12-product',
  'ai-opportunity': 'module-16-product',
  'intelligent-query': 'module-20-product',
  'internal-knowledge': 'module-25-product',
  'ai-replenishment': 'module-29-product',
  'ai-payment': 'module-33-product',
  'monitoring-alert': 'module-45-product',
  'user-behavior': 'module-41-product',
  'contract-review': 'module-37-product',
};

// 模块文本映射
const moduleTextMap = {
  'ai-customer-service': 'AI客服',
  'product-recommendation': '产品智能推荐',
  'order-tracking': '订单进度查询',
  'ai-opportunity': 'AI商机识别',
  'intelligent-query': '智能问数',
  'internal-knowledge': '内部知识库',
  'ai-replenishment': 'AI补货',
  'ai-payment': 'AI付款',
  'monitoring-alert': '监控告警',
  'user-behavior': '用户行为分析',
  'contract-review': '合同审核',
};

// 计算每个父级现有的最大order值
const parentOrderCount = {};
data.tasks.forEach(task => {
  if (task.view === 'product' && task.parent) {
    if (!parentOrderCount[task.parent]) {
      parentOrderCount[task.parent] = 0;
    }
    if (task.order !== undefined && task.order >= parentOrderCount[task.parent]) {
      parentOrderCount[task.parent] = task.order + 1;
    }
  }
});

// 初始化计数器
const parentCounter = {};
Object.values(moduleMap).forEach(parentId => {
  parentCounter[parentId] = parentOrderCount[parentId] || 0;
});

// 任务数据 - 按模块分组
const newTasksData = [
  // 模块：AI客服 (ID: ai-customer-service)
  {
    moduleId: 'ai-customer-service',
    tasks: [
      { text: '数据接入-结构化数据直通本体', owner: '周朝阳', start_date: '2026-02-11', end_date: '2026-02-28' },
      { text: '数据接入-非结构化文件直通本体', owner: '周朝阳', start_date: '2026-02-11', end_date: '2026-02-28' },
      { text: '智能问答应用-非结构化问答-从直通本体接入', owner: '郭昭乾', start_date: '2026-02-11', end_date: '2026-02-28' },
      { text: '数据编排-非结构化OCR识别效果和bug修复', owner: '孙攀', start_date: '2026-02-11', end_date: '2026-02-28' },
      { text: '离线数据对接-数据增量更新和更新方案确认', owner: '黄韵文+客户', start_date: '2026-02-11', end_date: '2026-02-28' },
      { text: 'SAP系统数据对接-和对方确认数据接口，撰写接口标准', owner: '孙攀', start_date: '2026-02-11', end_date: '2026-02-28' },
      { text: '提供H5链接给客户项目组测试，辅助客户接入企业微信和公众号', owner: '郭昭乾', start_date: '2026-03-16', end_date: '2026-03-27' },
      { text: '测试应用搭建', owner: '黄宇萌', start_date: '2026-03-28', end_date: '2026-04-10' },
      { text: '应用迁移至正式环节', owner: '黄韵文+黄宇萌', start_date: '2026-04-11', end_date: '2026-04-30' },
    ]
  },
  // 模块：产品智能推荐 (ID: product-recommendation)
  {
    moduleId: 'product-recommendation',
    tasks: [
      { text: 'Workshop智能问答组件增加产品设计，支持回答问题后追加推荐', owner: '黄宇萌', start_date: '2026-02-11', end_date: '2026-02-28' },
      { text: '全量非结构化数据接入', owner: '孙攀', start_date: '2026-02-11', end_date: '2026-02-28' },
      { text: '测试应用搭建', owner: '黄宇萌', start_date: '2026-03-01', end_date: '2026-04-10' },
      { text: '应用迁移至正式环节', owner: '黄韵文+黄宇萌', start_date: '2026-04-11', end_date: '2026-04-30' },
    ]
  },
  // 模块：订单进度查询 (ID: order-tracking)
  {
    moduleId: 'order-tracking',
    tasks: [
      { text: '物流信息查询的前后端开发', owner: '郭昭乾+段晓博', start_date: '2026-02-11', end_date: '2026-02-28' },
      { text: '测试应用搭建', owner: '黄宇萌', start_date: '2026-03-01', end_date: '2026-04-10' },
      { text: '应用迁移至正式环节', owner: '黄韵文+黄宇萌', start_date: '2026-04-11', end_date: '2026-04-30' },
    ]
  },
  // 模块：AI商机识别 (ID: ai-opportunity)
  {
    moduleId: 'ai-opportunity',
    tasks: [
      { text: '后台搭建基于用户体系的QA表和日志', owner: '欧阳军', start_date: '2026-02-11', end_date: '2026-02-28' },
      { text: '数据接入+编排，对租户「中源」进行过滤，筛选出该租户下所有问题，走通产品逻辑', owner: '孙攀', start_date: '2026-03-02', end_date: '2026-03-06' },
      { text: '测试应用搭建', owner: '黄宇萌', start_date: '2026-03-07', end_date: '2026-04-10' },
      { text: '应用迁移至正式环节', owner: '黄韵文+黄宇萌', start_date: '2026-04-11', end_date: '2026-04-30' },
    ]
  },
  // 模块：智能问数 (ID: intelligent-query)
  {
    moduleId: 'intelligent-query',
    tasks: [
      { text: '本体建模', owner: '黄韵文', start_date: '2026-02-11', end_date: '2026-02-28' },
      { text: '数据接入和编排', owner: '孙攀', start_date: '2026-03-02', end_date: '2026-03-13' },
      { text: '应用搭建', owner: '黄宇萌', start_date: '2026-03-09', end_date: '2026-03-20' },
      { text: '测试应用搭建', owner: '黄宇萌', start_date: '2026-03-21', end_date: '2026-04-10' },
      { text: '应用迁移至正式环节', owner: '黄韵文+黄宇萌', start_date: '2026-04-11', end_date: '2026-04-30' },
    ]
  },
  // 模块：内部知识库 (ID: internal-knowledge)
  {
    moduleId: 'internal-knowledge',
    tasks: [
      { text: '数据对接-培训文档和制度文件', owner: '黄韵文+客户', start_date: '2026-02-11', end_date: '2026-03-06' },
      { text: '应用搭建', owner: '黄宇萌', start_date: '2026-03-09', end_date: '2026-03-20' },
      { text: '测试应用搭建', owner: '黄宇萌', start_date: '2026-03-21', end_date: '2026-04-10' },
      { text: '应用迁移至正式环节', owner: '黄韵文+黄宇萌', start_date: '2026-04-11', end_date: '2026-04-30' },
    ]
  },
  // 模块：AI补货 (ID: ai-replenishment)
  {
    moduleId: 'ai-replenishment',
    tasks: [
      { text: '应用设计', owner: '黄宇萌', start_date: '2026-02-11', end_date: '2026-02-28' },
      { text: '本体建模', owner: '黄韵文', start_date: '2026-03-02', end_date: '2026-03-13' },
      { text: '数据接入编排', owner: '孙攀', start_date: '2026-03-14', end_date: '2026-03-20' },
      { text: '应用搭建', owner: '黄宇萌', start_date: '2026-03-21', end_date: '2026-03-31' },
      { text: '测试应用搭建', owner: '黄宇萌', start_date: '2026-04-01', end_date: '2026-04-10' },
      { text: '应用迁移至正式环节', owner: '黄韵文+黄宇萌', start_date: '2026-04-11', end_date: '2026-04-30' },
    ]
  },
  // 模块：AI付款 (ID: ai-payment)
  {
    moduleId: 'ai-payment',
    tasks: [
      { text: '应用设计', owner: '黄宇萌', start_date: '2026-02-11', end_date: '2026-02-28' },
      { text: '本体建模', owner: '黄韵文', start_date: '2026-03-02', end_date: '2026-03-13' },
      { text: '数据接入编排', owner: '孙攀', start_date: '2026-03-14', end_date: '2026-03-20' },
      { text: '应用搭建', owner: '黄宇萌', start_date: '2026-03-21', end_date: '2026-03-31' },
      { text: '测试应用搭建', owner: '黄宇萌', start_date: '2026-04-01', end_date: '2026-04-10' },
      { text: '应用迁移至正式环节', owner: '黄韵文+黄宇萌', start_date: '2026-04-11', end_date: '2026-04-30' },
    ]
  },
  // 模块：监控告警 (ID: monitoring-alert)
  {
    moduleId: 'monitoring-alert',
    tasks: [
      { text: '应用设计', owner: '黄宇萌', start_date: '2026-02-11', end_date: '2026-02-28' },
      { text: '本体建模', owner: '黄韵文', start_date: '2026-03-02', end_date: '2026-03-13' },
      { text: '数据接入编排', owner: '孙攀', start_date: '2026-03-14', end_date: '2026-03-20' },
      { text: '应用搭建', owner: '黄宇萌', start_date: '2026-03-21', end_date: '2026-03-31' },
      { text: '测试应用搭建', owner: '黄宇萌', start_date: '2026-04-01', end_date: '2026-04-10' },
      { text: '应用迁移至正式环节', owner: '黄韵文+黄宇萌', start_date: '2026-04-11', end_date: '2026-04-30' },
    ]
  },
  // 模块：用户行为分析 (ID: user-behavior)
  {
    moduleId: 'user-behavior',
    tasks: [
      { text: '应用设计', owner: '黄宇萌', start_date: '2026-02-11', end_date: '2026-02-28' },
      { text: '本体建模', owner: '黄韵文', start_date: '2026-03-02', end_date: '2026-03-13' },
      { text: '数据接入编排', owner: '孙攀', start_date: '2026-03-14', end_date: '2026-03-20' },
      { text: '应用搭建', owner: '黄宇萌', start_date: '2026-03-21', end_date: '2026-03-31' },
      { text: '测试应用搭建', owner: '黄宇萌', start_date: '2026-04-01', end_date: '2026-04-10' },
      { text: '应用迁移至正式环节', owner: '黄韵文+黄宇萌', start_date: '2026-04-11', end_date: '2026-04-30' },
    ]
  },
  // 模块：合同审核 (ID: contract-review)
  {
    moduleId: 'contract-review',
    tasks: [
      { text: '应用设计-增加本体上传和规则关联', owner: '黄宇萌', start_date: '2026-02-11', end_date: '2026-02-28' },
      { text: '本体建模（合同、本体库）', owner: '孙攀', start_date: '2026-03-02', end_date: '2026-03-13' },
      { text: '应用设计开发', owner: '欧阳军', start_date: '2026-03-14', end_date: '2026-03-31' },
      { text: '测试应用搭建', owner: '黄宇萌', start_date: '2026-04-01', end_date: '2026-04-10' },
      { text: '应用迁移至正式环节', owner: '黄韵文+黄宇萌', start_date: '2026-04-11', end_date: '2026-04-30' },
    ]
  },
];

// 添加新任务
let addedCount = 0;
newTasksData.forEach(moduleData => {
  const userModuleId = moduleData.moduleId;
  const parentId = moduleMap[userModuleId];

  if (!parentId) {
    console.error(`找不到模块映射: ${userModuleId}`);
    return;
  }

  moduleData.tasks.forEach((taskData, index) => {
    // 计算工期
    const start = new Date(taskData.start_date);
    const end = new Date(taskData.end_date);
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // 生成任务ID
    const taskId = `${userModuleId}-${index + 1}`;

    // 检查是否已存在相同ID的任务
    const existingTask = data.tasks.find(t => t.id === taskId);
    if (existingTask) {
      console.log(`任务已存在，跳过: ${taskId}`);
      return;
    }

    // 创建新任务对象
    const newTask = {
      id: taskId,
      text: taskData.text,
      type: 'task',
      parent: parentId,
      start_date: taskData.start_date,
      end_date: taskData.end_date,
      duration: duration,
      progress: 0,
      owner: taskData.owner,
      phase: 'H1',
      is_milestone: false,
      priority: 'medium',
      status: 'planned',
      description: '',
      order: parentCounter[parentId],
      view: 'product'
    };

    // 添加到任务列表
    data.tasks.push(newTask);
    parentCounter[parentId]++;
    addedCount++;

    console.log(`添加任务: ${taskId} (${taskData.text})`);
  });
});

// 保存更新后的数据
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log(`\n✅ 完成！共添加 ${addedCount} 个新任务。`);
console.log(`总任务数: ${data.tasks.length}`);

// 验证添加的任务
console.log('\n验证添加的任务:');
newTasksData.forEach(moduleData => {
  const userModuleId = moduleData.moduleId;
  const parentId = moduleMap[userModuleId];
  const moduleTasks = data.tasks.filter(t => t.parent === parentId && t.view === 'product');
  console.log(`模块 ${moduleTextMap[userModuleId]} (${parentId}): ${moduleTasks.length} 个任务`);
});