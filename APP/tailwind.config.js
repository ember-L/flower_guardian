/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 主色调 - 花瓣粉
        primary: '#f46',
        primaryLight: '#ff6b88',
        primaryDark: '#e6335c',
        // 辅助色
        secondary: '#52c41a',
        secondaryLight: '#7bc98a',
        accent: '#faad14',
        accentLight: '#ffe58f',
        // 背景色
        background: '#fafafa',
        surface: '#ffffff',
        surfaceElevated: '#fffbf5',
        // 文字色
        text: '#333333',
        'text-secondary': '#666666',
        'text-tertiary': '#999999',
        'text-light': '#b3b3b3',
        // 功能色
        error: '#ff4d4f',
        errorLight: '#ffccc7',
        success: '#52c41a',
        successLight: '#f6ffed',
        warning: '#faad14',
        warningLight: '#fffbe6',
        // 边框和分割线
        border: '#eeeeee',
        divider: '#f5f5f5',
        // 品牌色
        info: '#007aff',
        infoLight: '#e6f2ff',
      },
      borderRadius: {
        none: 0,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        xxl: 24,
        xxxl: 32,
      },
      fontSize: {
        xs: 11,
        sm: 13,
        md: 15,
        lg: 17,
        xl: 20,
        xxl: 24,
        xxxl: 32,
        display: 40,
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 20,
        xl: 24,
        xxl: 32,
        xxxl: 48,
      },
      boxShadow: {
        soft: '0 2px 12px rgba(0, 0, 0, 0.04)',
        card: '0 4px 16px rgba(0, 0, 0, 0.06)',
        'card-pink': '0 4px 20px rgba(244, 68, 102, 0.15)',
        lg: '0 4px 20px rgba(244, 68, 102, 0.15)',
        xl: '0 8px 24px rgba(244, 68, 102, 0.2)',
      },
    },
  },
  plugins: [],
};
