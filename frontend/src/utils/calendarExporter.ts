/**
 * 日历导出工具
 * 支持导出为 ICS (iCalendar) 格式，兼容 Google Calendar、Outlook、Apple Calendar
 */

import type { GanttTask } from '@/types/gantt';

/**
 * 生成 ICS 文件内容
 * @param tasks 要导出的任务列表
 * @param projectName 项目名称
 * @returns ICS 文件内容字符串
 */
export function generateICS(
  tasks: GanttTask[],
  projectName: string = '甘特图项目'
): string {
  // ICS 文件头
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI Gantt Chart//Calendar Export//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:' + escapeICSField(projectName),
    'X-WR-TIMEZONE:Asia/Shanghai',
  ].join('\r\n') + '\r\n';

  // 添加每个任务作为日历事件
  tasks.forEach((task, index) => {
    // 跳过里程碑（没有持续时间的事件）
    if (task.is_milestone) {
      icsContent += generateMilestoneEvent(task, index);
    } else {
      icsContent += generateTaskEvent(task, index);
    }
  });

  // ICS 文件尾
  icsContent += 'END:VCALENDAR\r\n';

  return icsContent;
}

/**
 * 生成普通任务事件
 */
function generateTaskEvent(task: GanttTask, index: number): string {
  const eventId = `task-${task.id}-${index}@gantt.local`;
  const summary = `📋 ${task.text}`;
  const description = buildTaskDescription(task);

  // 解析日期
  const startDate = parseDate(task.start_date);
  const endDate = parseDate(task.end_date);

  // 如果是全天事件（没有具体时间）
  const isAllDay = true; // 甘特图任务通常是全天事件

  const eventLines = [
    'BEGIN:VEVENT',
    `UID:${eventId}`,
    `SUMMARY:${escapeICSField(summary)}`,
    `DESCRIPTION:${escapeICSField(description)}`,
    `LOCATION:${escapeICSField('项目: ' + (task.parent ? '子任务' : '主任务'))}`,
  ];

  if (isAllDay) {
    // 全天事件格式
    eventLines.push(`DTSTART;VALUE=DATE:${formatICalDate(startDate)}`);
    // ICS 中全天事件的结束日期是 exclusive 的，所以需要加一天
    const exclusiveEndDate = new Date(endDate);
    exclusiveEndDate.setDate(exclusiveEndDate.getDate() + 1);
    eventLines.push(`DTEND;VALUE=DATE:${formatICalDate(exclusiveEndDate)}`);
  } else {
    // 有时间的事件
    eventLines.push(`DTSTART:${formatICalDateTime(startDate)}`);
    eventLines.push(`DTEND:${formatICalDateTime(endDate)}`);
  }

  // 状态和优先级
  const statusMap: Record<string, string> = {
    'planned': 'TENTATIVE',
    'in-progress': 'CONFIRMED',
    'completed': 'CONFIRMED',
    'blocked': 'CANCELLED',
  };

  const priorityMap: Record<string, number> = {
    'high': 1,
    'medium': 5,
    'low': 9,
  };

  eventLines.push(`STATUS:${statusMap[task.status] || 'TENTATIVE'}`);
  if (task.priority && priorityMap[task.priority]) {
    eventLines.push(`PRIORITY:${priorityMap[task.priority]}`);
  }

  // 提醒（提前1天）
  eventLines.push('BEGIN:VALARM');
  eventLines.push('TRIGGER:-P1D');
  eventLines.push('ACTION:DISPLAY');
  eventLines.push(`DESCRIPTION:${escapeICSField(`任务 "${task.text}" 即将开始`)}`);
  eventLines.push('END:VALARM');

  eventLines.push('END:VEVENT\r\n');

  return eventLines.join('\r\n');
}

/**
 * 生成里程碑事件
 */
function generateMilestoneEvent(task: GanttTask, index: number): string {
  const eventId = `milestone-${task.id}-${index}@gantt.local`;
  const summary = `🏆 ${task.text}`;
  const description = buildTaskDescription(task);

  const date = parseDate(task.start_date);

  const eventLines = [
    'BEGIN:VEVENT',
    `UID:${eventId}`,
    `SUMMARY:${escapeICSField(summary)}`,
    `DESCRIPTION:${escapeICSField(description)}`,
    `LOCATION:${escapeICSField('里程碑')}`,
    `DTSTART;VALUE=DATE:${formatICalDate(date)}`,
    `DTEND;VALUE=DATE:${formatICalDate(date)}`, // 同一天结束
    'TRANSP:TRANSPARENT', // 里程碑不占用时间
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICSField(`里程碑 "${task.text}" 即将到来`)}`,
    'END:VALARM',
    'END:VEVENT\r\n',
  ];

  return eventLines.join('\r\n');
}

/**
 * 构建任务描述
 */
function buildTaskDescription(task: GanttTask): string {
  const parts = [];

  if (task.owner) {
    parts.push(`负责人: ${task.owner}`);
  }

  if (task.description) {
    parts.push(`描述: ${task.description}`);
  }

  parts.push(`进度: ${Math.round(task.progress * 100)}%`);
  parts.push(`状态: ${getStatusText(task.status)}`);
  parts.push(`优先级: ${getPriorityText(task.priority)}`);

  if (task.phase) {
    parts.push(`阶段: ${task.phase}`);
  }

  return parts.join('\\n');
}

/**
 * 解析日期字符串
 */
function parseDate(dateStr: string): Date {
  // 支持多种日期格式
  if (dateStr.includes('T')) {
    return new Date(dateStr);
  }

  // 假设是 YYYY-MM-DD 格式
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * 格式化为 ICS 日期 (YYYYMMDD)
 */
function formatICalDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * 格式化为 ICS 日期时间 (YYYYMMDDTHHMMSSZ)
 */
function formatICalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * 转义 ICS 字段
 */
function escapeICSField(field: string): string {
  return field
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * 获取状态文本
 */
function getStatusText(status: string): string {
  const map: Record<string, string> = {
    'planned': '计划中',
    'in-progress': '进行中',
    'completed': '已完成',
    'blocked': '已阻塞',
  };
  return map[status] || status;
}

/**
 * 获取优先级文本
 */
function getPriorityText(priority: string): string {
  const map: Record<string, string> = {
    'high': '高',
    'medium': '中',
    'low': '低',
  };
  return map[priority] || priority;
}

/**
 * 导出为 ICS 文件
 */
export function exportToCalendar(
  tasks: GanttTask[],
  projectName: string = '甘特图项目'
): void {
  try {
    const icsContent = generateICS(tasks, projectName);

    // 创建 Blob 并下载
    const blob = new Blob([icsContent], {
      type: 'text/calendar;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gantt-calendar-${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('日历导出成功，包含', tasks.length, '个任务');
  } catch (error) {
    console.error('日历导出失败:', error);
    alert('日历导出失败: ' + (error as Error).message);
  }
}

/**
 * 导出选中的任务到日历
 */
export function exportSelectedTasksToCalendar(
  tasks: GanttTask[],
  selectedTaskIds: string[],
  projectName: string = '甘特图项目'
): void {
  const selectedTasks = tasks.filter(task => selectedTaskIds.includes(task.id));

  if (selectedTasks.length === 0) {
    alert('请先选择要导出的任务');
    return;
  }

  exportToCalendar(selectedTasks, projectName);
}

/**
 * 获取 Google Calendar 分享 URL（未来功能）
 */
export function getGoogleCalendarShareURL(_tasks: GanttTask[]): string {
  // 注意：Google Calendar API 需要 OAuth 认证
  // 这里返回一个占位符 URL
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE';
}

/**
 * 获取 Outlook Calendar 分享 URL（未来功能）
 */
export function getOutlookCalendarShareURL(_tasks: GanttTask[]): string {
  // Outlook 日历分享 URL 格式
  return 'https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent';
}