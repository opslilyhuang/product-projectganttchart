/**
 * 日期工具函数
 */

import { format, parse, addDays, differenceInDays } from 'date-fns';

export function formatDate(date: Date | string, pattern: string = 'yyyy-MM-dd'): string {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  return format(dateObj, pattern);
}

export function parseDate(dateStr: string): Date {
  return parse(dateStr, 'yyyy-MM-dd', new Date());
}

export function calculateDuration(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? parseDate(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseDate(endDate) : endDate;
  return differenceInDays(end, start) + 1;
}

export function addDaysToDate(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  return addDays(dateObj, days);
}

export function isValidDate(dateStr: string): boolean {
  try {
    const date = parseDate(dateStr);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

export function getTodayString(): string {
  return formatDate(new Date());
}
