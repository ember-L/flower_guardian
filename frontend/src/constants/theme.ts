// 主题颜色配置 - 现代化UI设计
// 主色调保持 #e94b52 (护花使者红)
export const colors = {
  primary: '#e94b52',        // 主色调 - 护花使者红
  primaryLight: '#f06b70',   // 主色调浅色
  primaryDark: '#c73e47',    // 主色调深色
  secondary: '#5aaf6a',      // 清新绿
  secondaryLight: '#7bc98a', // 清新绿浅色
  accent: '#f5d78e',         // 暖木色/米黄色
  accentLight: '#f7e4b8',    // 暖木色浅色
  background: '#faf8f5',    // 背景色
  surface: '#ffffff',        // 卡片/表面色
  surfaceElevated: '#fffbf5', // 浮起表面
  text: '#1a1a1a',           // 主要文字 (深色，更清晰)
  'text-secondary': '#5a5a5a', // 次要文字
  'text-tertiary': '#8c8c8c', // 辅助文字
  'text-light': '#b3b3b3',   // 弱化文字
  white: '#ffffff',
  black: '#000000',
  error: '#e94b52',
  errorLight: '#fdd',       // 错误浅色背景
  success: '#5aaf6a',
  successLight: '#e8f5e9',  // 成功浅色背景
  warning: '#f5a623',
  warningLight: '#fff8e1',  // 警告浅色背景
  // 边框和分割线
  border: '#e8e4df',
  divider: '#f0ede8',
  // 阴影色
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
};

// 间距配置 - 优化移动端触摸区域
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// 圆角配置 - Organic Biophilic 风格 (柔和有机)
export const borderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
};

// 字体大小 - 确保移动端可读性
export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

// 字重配置
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// 阴影配置 - 柔和自然
export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
};

// 触摸目标最小尺寸 (遵循 44x44 原则)
export const touchTarget = {
  minimum: 44,
  comfortable: 48,
  large: 56,
};

// 动画时长 (毫秒) - 流畅过渡
export const duration = {
  fast: 150,
  normal: 250,
  slow: 350,
};

// 透明度
export const opacity = {
  disabled: 0.4,
  pressed: 0.7,
  hover: 0.8,
};
