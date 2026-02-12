/**
 * 输入框组件 - GPT/Gemini风格
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
          'px-4 h-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200',
          'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
          'placeholder:text-gray-400',
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
            : 'hover:border-gray-400',
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