/**
 * 通用按钮组件 - GPT/Gemini风格
 */

import { type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-300 rounded-md',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-2 focus:ring-gray-300 rounded-md',
    outline: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-300 rounded-md',
  };

  const sizeStyles = {
    sm: 'px-3 h-8 text-sm',
    md: 'px-4 h-10 text-base',
    lg: 'px-6 h-12 text-base font-medium',
  };

  return (
    <button
      className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {children}
    </button>
  );
}
