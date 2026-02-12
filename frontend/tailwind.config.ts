import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 原有甘特图颜色（保留兼容性）
        module: '#6395ed',
        task: '#66bb6a',
        subtask: '#ffa726',
        milestone: '#ffc107',

        // GPT/Gemini现代设计系统
        'ai-primary': '#0ea5e9',        // AI蓝色主色调 (GPT/Gemini风格)
        'ai-green': '#10a37f',          // GPT绿色强调色
        'ai-blue': '#1a73e8',           // Gemini蓝色
        'ai-surface': '#ffffff',        // 表面白色
        'ai-background': '#f7f7f8',     // 背景浅灰 (GPT风格)

        // 中性色阶 (Material Design 3)
        'ai-gray-50': '#fafafa',
        'ai-gray-100': '#f5f5f5',
        'ai-gray-200': '#e5e5e5',
        'ai-gray-300': '#d4d4d4',
        'ai-gray-400': '#a3a3a3',
        'ai-gray-500': '#737373',
        'ai-gray-600': '#525252',
        'ai-gray-700': '#404040',
        'ai-gray-800': '#262626',
        'ai-gray-900': '#171717',

        // 语义颜色
        'ai-success': '#10b981',
        'ai-warning': '#f59e0b',
        'ai-error': '#ef4444',
        'ai-info': '#3b82f6',

        // 边框颜色
        'ai-border': '#d9d9e3',         // GPT输入框边框色
        'ai-border-light': '#e5e5e5',
        'ai-border-hover': '#a5a5a5',

        // 文字颜色
        'ai-text-primary': '#171717',
        'ai-text-secondary': '#525252',
        'ai-text-muted': '#a3a3a3',
        'ai-text-on-primary': '#ffffff',
      },
      borderRadius: {
        'ai-sm': '4px',
        'ai-md': '8px',
        'ai-lg': '12px',
        'ai-xl': '16px',
        'ai-2xl': '28px',
      },
      boxShadow: {
        'ai-subtle': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'ai-card': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'ai-elevation-1': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'ai-elevation-2': '0 2px 4px rgba(0, 0, 0, 0.05)',
        'ai-elevation-3': '0 4px 8px rgba(0, 0, 0, 0.07)',
        'ai-elevation-4': '0 8px 16px rgba(0, 0, 0, 0.1)',
        'ai-glow': '0 0 0 3px rgba(14, 165, 233, 0.1)',
      },
      spacing: {
        'ai-input-height': '48px',
        'ai-button-height': '48px',
        'ai-touch-target': '44px',
      },
      animation: {
        'ai-fade-in': 'fadeIn 0.2s ease-out',
        'ai-slide-up': 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'ai-pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      transitionTimingFunction: {
        'ai-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config
