import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        module: '#6395ed',
        task: '#66bb6a',
        subtask: '#ffa726',
        milestone: '#ffc107',
      },
    },
  },
  plugins: [],
} satisfies Config
