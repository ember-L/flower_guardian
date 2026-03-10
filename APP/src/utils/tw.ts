// Tailwind-like utility for React Native
// 将 className 字符串转换为 StyleSheet 样式

import { StyleSheet } from 'react-native';

// 颜色映射
const colors = {
  primary: '#f46',
  primaryLight: '#ff6b88',
  primaryDark: '#e6335c',
  secondary: '#52c41a',
  accent: '#faad14',
  background: '#fafafa',
  surface: '#ffffff',
  text: '#333333',
  'text-secondary': '#666666',
  'text-tertiary': '#999999',
  border: '#eeeeee',
  error: '#ff4d4f',
  success: '#52c41a',
  warning: '#faad14',
  info: '#007aff',
  white: '#ffffff',
  black: '#000000',
};

// 解析 className 并返回样式对象
export function tw(...classNames: string[]) {
  const styles: any[] = [];

  classNames.forEach((className) => {
    const classes = className.split(' ').filter(Boolean);

    classes.forEach((cls) => {
      // 背景色
      if (cls.startsWith('bg-')) {
        const colorKey = cls.replace('bg-', '').replace('[', '').replace(']', '');
        if (colors[colorKey]) {
          styles.push({ backgroundColor: colors[colorKey] });
        } else if (cls.includes('[')) {
          // 处理自定义颜色 bg-[#f46]
          const match = cls.match(/bg-\[(#[0-9a-fA-F]+)\]/);
          if (match) {
            styles.push({ backgroundColor: match[1] });
          }
        }
      }

      // 文字颜色
      if (cls.startsWith('text-')) {
        const colorKey = cls.replace('text-', '').replace('[', '').replace(']', '');
        if (colors[colorKey]) {
          styles.push({ color: colors[colorKey] });
        }
      }

      // 边框颜色
      if (cls.startsWith('border-')) {
        const colorKey = cls.replace('border-', '').replace('[', '').replace(']', '');
        if (colors[colorKey]) {
          styles.push({ borderColor: colors[colorKey] });
        }
      }

      // 圆角
      if (cls.startsWith('rounded-')) {
        const size = cls.replace('rounded-', '');
        const radiusMap: Record<string, number> = {
          none: 0,
          sm: 4,
          md: 8,
          lg: 12,
          xl: 16,
          '2xl': 20,
          '3xl': 24,
          full: 9999,
        };
        if (radiusMap[size] !== undefined) {
          styles.push({ borderRadius: radiusMap[size] });
        }
      }

      // 间距
      if (cls.startsWith('p-')) {
        const size = cls.replace('p-', '');
        const spacing: Record<string, number> = { xs: 4, sm: 8, md: 16, lg: 20, xl: 24, '2xl': 32, '3xl': 48 };
        if (spacing[size] !== undefined) {
          styles.push({ padding: spacing[size] });
        }
      }

      if (cls.startsWith('px-')) {
        const size = cls.replace('px-', '');
        const spacing: Record<string, number> = { xs: 4, sm: 8, md: 16, lg: 20, xl: 24 };
        if (spacing[size] !== undefined) {
          styles.push({ paddingHorizontal: spacing[size] });
        }
      }

      if (cls.startsWith('py-')) {
        const size = cls.replace('py-', '');
        const spacing: Record<string, number> = { xs: 4, sm: 8, md: 16, lg: 20, xl: 24 };
        if (spacing[size] !== undefined) {
          styles.push({ paddingVertical: spacing[size] });
        }
      }

      if (cls.startsWith('pt-')) {
        const size = cls.replace('pt-', '');
        const spacing: Record<string, number> = { xs: 4, sm: 8, md: 16, lg: 20, xl: 24, '2xl': 32 };
        if (spacing[size] !== undefined) {
          styles.push({ paddingTop: spacing[size] });
        }
      }

      if (cls.startsWith('pb-')) {
        const size = cls.replace('pb-', '');
        const spacing: Record<string, number> = { xs: 4, sm: 8, md: 16, lg: 20, xl: 24, '2xl': 32 };
        if (spacing[size] !== undefined) {
          styles.push({ paddingBottom: spacing[size] });
        }
      }

      if (cls.startsWith('m-')) {
        const size = cls.replace('m-', '');
        const spacing: Record<string, number> = { xs: 4, sm: 8, md: 16, lg: 20, xl: 24 };
        if (spacing[size] !== undefined) {
          styles.push({ margin: spacing[size] });
        }
      }

      if (cls.startsWith('mt-')) {
        const size = cls.replace('mt-', '');
        const spacing: Record<string, number> = { xs: 4, sm: 8, md: 16, lg: 20, xl: 24 };
        if (spacing[size] !== undefined) {
          styles.push({ marginTop: spacing[size] });
        }
      }

      if (cls.startsWith('mb-')) {
        const size = cls.replace('mb-', '');
        const spacing: Record<string, number> = { xs: 4, sm: 8, md: 16, lg: 20, xl: 24 };
        if (spacing[size] !== undefined) {
          styles.push({ marginBottom: spacing[size] });
        }
      }

      if (cls.startsWith('ml-')) {
        const size = cls.replace('ml-', '');
        const spacing: Record<string, number> = { xs: 4, sm: 8, md: 16, lg: 20, xl: 24 };
        if (spacing[size] !== undefined) {
          styles.push({ marginLeft: spacing[size] });
        }
      }

      if (cls.startsWith('mr-')) {
        const size = cls.replace('mr-', '');
        const spacing: Record<string, number> = { xs: 4, sm: 8, md: 16, lg: 20, xl: 24 };
        if (spacing[size] !== undefined) {
          styles.push({ marginRight: spacing[size] });
        }
      }

      // 宽高
      if (cls.startsWith('w-')) {
        const size = cls.replace('w-', '');
        if (size === 'full') {
          styles.push({ width: '100%' });
        } else if (size === 'screen') {
          styles.push({ width: '100%' });
        } else {
          const num = parseInt(size);
          if (!isNaN(num)) {
            styles.push({ width: num * 4 });
          }
        }
      }

      if (cls.startsWith('h-')) {
        const size = cls.replace('h-', '');
        if (size === 'full') {
          styles.push({ height: '100%' });
        } else if (size === 'screen') {
          styles.push({ height: '100%' });
        } else {
          const num = parseInt(size);
          if (!isNaN(num)) {
            styles.push({ height: num * 4 });
          }
        }
      }

      // Flexbox
      if (cls === 'flex') {
        styles.push({ display: 'flex' });
      }
      if (cls === 'flex-1') {
        styles.push({ flex: 1 });
      }
      if (cls === 'flex-row') {
        styles.push({ flexDirection: 'row' });
      }
      if (cls === 'flex-col') {
        styles.push({ flexDirection: 'column' });
      }
      if (cls === 'flex-wrap') {
        styles.push({ flexWrap: 'wrap' });
      }
      if (cls.startsWith('flex-')) {
        const num = cls.replace('flex-', '');
        const flexNum = parseInt(num);
        if (!isNaN(flexNum)) {
          styles.push({ flex: flexNum });
        }
      }

      // 对齐
      if (cls === 'items-center') {
        styles.push({ alignItems: 'center' });
      }
      if (cls === 'items-start') {
        styles.push({ alignItems: 'flex-start' });
      }
      if (cls === 'items-end') {
        styles.push({ alignItems: 'flex-end' });
      }
      if (cls === 'justify-center') {
        styles.push({ justifyContent: 'center' });
      }
      if (cls === 'justify-between') {
        styles.push({ justifyContent: 'space-between' });
      }
      if (cls === 'justify-around') {
        styles.push({ justifyContent: 'space-around' });
      }
      if (cls === 'justify-end') {
        styles.push({ justifyContent: 'flex-end' });
      }
      if (cls === 'self-center') {
        styles.push({ alignSelf: 'center' });
      }

      // 文字
      if (cls.startsWith('text-')) {
        const size = cls.replace('text-', '');
        const fontSizeMap: Record<string, number> = {
          xs: 11, sm: 13, md: 15, lg: 17, xl: 20, '2xl': 24, '3xl': 32
        };
        if (fontSizeMap[size] !== undefined) {
          styles.push({ fontSize: fontSizeMap[size] });
        }
      }

      if (cls === 'font-bold') {
        styles.push({ fontWeight: '700' });
      }
      if (cls === 'font-semibold') {
        styles.push({ fontWeight: '600' });
      }
      if (cls === 'font-medium') {
        styles.push({ fontWeight: '500' });
      }
      if (cls === 'italic') {
        styles.push({ fontStyle: 'italic' });
      }
      if (cls === 'text-center') {
        styles.push({ textAlign: 'center' });
      }

      // 边框
      if (cls === 'border') {
        styles.push({ borderWidth: 1, borderColor: colors.border });
      }
      if (cls.startsWith('border-t')) {
        styles.push({ borderTopWidth: 1, borderColor: colors.border });
      }
      if (cls.startsWith('border-b')) {
        styles.push({ borderBottomWidth: 1, borderColor: colors.border });
      }

      // 阴影
      if (cls.startsWith('shadow-')) {
        const shadowSize = cls.replace('shadow-', '');
        if (shadowSize === 'sm') {
          styles.push({ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 });
        } else if (shadowSize === 'md') {
          styles.push({ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 });
        } else if (shadowSize === 'lg' || shadowSize === 'card-pink') {
          styles.push({ shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 6 });
        }
      }

      // 位置
      if (cls === 'absolute') {
        styles.push({ position: 'absolute' });
      }
      if (cls === 'relative') {
        styles.push({ position: 'relative' });
      }
      if (cls.startsWith('top-')) {
        const size = cls.replace('top-', '');
        const num = parseInt(size);
        if (!isNaN(num)) {
          styles.push({ top: num * 4 });
        }
      }
      if (cls.startsWith('bottom-')) {
        const size = cls.replace('bottom-', '');
        const num = parseInt(size);
        if (!isNaN(num)) {
          styles.push({ bottom: num * 4 });
        }
      }
      if (cls.startsWith('left-')) {
        const size = cls.replace('left-', '');
        const num = parseInt(size);
        if (!isNaN(num)) {
          styles.push({ left: num * 4 });
        }
      }
      if (cls.startsWith('right-')) {
        const size = cls.replace('right-', '');
        const num = parseInt(size);
        if (!isNaN(num)) {
          styles.push({ right: num * 4 });
        }
      }

      // z-index
      if (cls.startsWith('z-')) {
        const num = parseInt(cls.replace('z-', ''));
        if (!isNaN(num)) {
          styles.push({ zIndex: num });
        }
      }

      // 其他
      if (cls === 'overflow-hidden') {
        styles.push({ overflow: 'hidden' });
      }
      if (cls === 'overflow-visible') {
        styles.push({ overflow: 'visible' });
      }
      if (cls === 'opacity-50') {
        styles.push({ opacity: 0.5 });
      }
      if (cls === 'opacity-60') {
        styles.push({ opacity: 0.6 });
      }
      if (cls === 'opacity-70') {
        styles.push({ opacity: 0.7 });
      }
      if (cls === 'opacity-80') {
        styles.push({ opacity: 0.8 });
      }
      if (cls === 'gap-1') {
        styles.push({ gap: 4 });
      }
      if (cls === 'gap-2') {
        styles.push({ gap: 8 });
      }
      if (cls === 'gap-3') {
        styles.push({ gap: 12 });
      }
      if (cls === 'gap-4') {
        styles.push({ gap: 16 });
      }
    });
  });

  return StyleSheet.flatten(styles);
}

export default tw;
