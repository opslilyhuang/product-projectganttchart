// 在浏览器控制台运行这个脚本来导出当前的localStorage数据
// 使用方法：
// 1. 打开 http://localhost:3004
// 2. 按F12打开开发者工具
// 3. 切换到 Console 标签
// 4. 复制并运行下面的代码

(function() {
  const data = localStorage.getItem('ganttData');
  if (!data) {
    console.error('没有找到ganttData');
    return;
  }

  const parsed = JSON.parse(data);
  console.log('当前localStorage数据：');
  console.log(JSON.stringify(parsed, null, 2));

  // 创建下载链接
  const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `localstorage-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('✅ 数据已导出到下载文件');

  // 同时显示智能问数助手的任务
  const iqTasks = parsed.productTasks?.filter(t => t.parent === 'module-20-product') || [];
  console.log('\n=== 智能问数助手任务 ===');
  iqTasks.sort((a, b) => (a.order || 0) - (b.order || 0)).forEach((t, i) => {
    console.log(`${i + 1}. ${t.text} (id: ${t.id}, owner: ${t.owner || '(无)'})`);
  });
})();
