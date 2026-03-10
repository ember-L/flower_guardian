// 主题颜色配置 - 护花使者 花瓣网粉色主题
// 使用 Tailwind/NativeWind
export const colors = {
  primary: '#f46',              // 主色调 - 花瓣粉
  primaryLight: '#ff6b88',      // 主色调浅色
  primaryDark: '#e6335c',       // 主色调深色
  secondary: '#52c41a',         // 清新绿
  secondaryLight: '#7bc98a',    // 清新绿浅色
  accent: '#faad14',            // 暖黄色
  accentLight: '#ffe58f',       // 暖黄色浅色
  background: '#fafafa',        // 背景色
  surface: '#ffffff',           // 卡片/表面色
  surfaceElevated: '#fffbf5',   // 浮起表面
  text: '#333333',              // 主要文字
  'text-secondary': '#666666',  // 次要文字
  'text-tertiary': '#999999',   // 辅助文字
  'text-light': '#b3b3b3',      // 弱化文字
  white: '#ffffff',
  black: '#000000',
  error: '#ff4d4f',            // 错误色
  errorLight: '#ffccc7',       // 错误浅色背景
  success: '#52c41a',          // 成功色
  successLight: '#f6ffed',     // 成功浅色背景
  warning: '#faad14',          // 警告色
  warningLight: '#fffbe6',     // 警告浅色背景
  info: '#007aff',             // 信息色
  infoLight: '#e6f2ff',        // 信息浅色背景
  // 边框和分割线
  border: '#eeeeee',
  divider: '#f5f5f5',
  // 阴影色
  shadow: 'rgba(244, 68, 102, 0.08)',
  shadowDark: 'rgba(244, 68, 102, 0.15)',
};

// 间距配置
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// 圆角配置
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

// 字体大小
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

// 阴影配置
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  lg: {
    shadowColor: '#f46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  xl: {
    shadowColor: '#f46',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
};

// 触摸目标最小尺寸
export const touchTarget = {
  minimum: 44,
  comfortable: 48,
  large: 56,
};

// 动画时长
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
