/**
 * 日期选择器组件
 */

import { type InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: string | Date | undefined;
  onChange: (date: string) => void;
}

export default function DatePicker({
  value,
  onChange,
  className,
  ...props
}: DatePickerProps) {
  const dateValue = value instanceof Date
    ? value.toISOString().split('T')[0]
    : value || '';

  return (
    <input
      type="date"
      value={dateValue}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(
        'w-full px-3 py-2 border border-gray-300 rounded-md',
        'focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
        'disabled:bg-gray-100 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  );
}
