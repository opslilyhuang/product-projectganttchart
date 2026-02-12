const fs = require('fs');
const data = {
  projectTasks: JSON.parse(localStorage.getItem('gantt-storage-v3')).state.projectTasks,
  productTasks: JSON.parse(localStorage.getItem('gantt-storage-v3')).state.productTasks
};
fs.writeFileSync('local_data.json', JSON.stringify(data, null, 2));
console.log('数据已导出');
