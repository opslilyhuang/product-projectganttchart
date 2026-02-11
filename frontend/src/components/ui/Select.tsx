/**
 * 下拉选择组件
 */

import { type SelectHTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
}

export default function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={clsx(
        'w-full px-3 py-2 border border-gray-300 rounded-md',
        'focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
        'disabled:bg-gray-100 disabled:cursor-not-allowed',
        'bg-white cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
