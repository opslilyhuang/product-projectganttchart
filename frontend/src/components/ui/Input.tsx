/**
 * 输入框组件
 */

import { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, fullWidth = true, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx(
          'px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors',
          'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
          fullWidth && 'w-full',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;