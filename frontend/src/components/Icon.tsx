// 自定义图标组件 - 使用 emoji 作为后备
// UI Kitten 有自己的 Icon 组件，但保留此组件用于特定场景（如 emoji 显示）
import React from 'react';
import { Text, StyleSheet, View } from 'react-native';

// 图标名称到 emoji 的映射
const iconEmojiMap: Record<string, string> = {
  // 基础图标
  camera: '📷',
  'camera-plus': '📷',
  image: '🖼️',
  'image-plus': '🖼️',
  flower2: '🌸',
  flower: '🌺',
  leaf: '🍃',
  'leaf-arrow': '🍃',
  book: '📖',
  'book-open': '📚',
  user: '👤',
  users: '👥',
  search: '🔍',
  settings: '⚙️',
  help: '❓',
  star: '⭐',
  'star-half': '⭐',
  'sun-medium': '☀️',
  sun: '☀️',
  'cloud-rain': '🌧️',
  'cloud-snow': '❄️',
  snowflake: '❄️',
  droplet: '💧',
  droplets: '💧',
  thermometer: '🌡️',
  // 操作图标
  plus: '➕',
  minus: '➖',
  check: '✓',
  'check-circle': '✓',
  x: '✕',
  'x-circle': '✕',
  'arrow-left': '←',
  'arrow-right': '→',
  'arrow-up': '↑',
  'arrow-down': '↓',
  chevron: '→',
  'chevron-right': '→',
  'chevron-left': '←',
  'chevron-down': '↓',
  loader: '⏳',
  'loader-2': '⏳',
  clock: '🕐',
  bell: '🔔',
  'bell-off': '🔕',
  calendar: '📅',
  share: '📤',
  heart: '❤️',
  'heart-outline': '🤍',
  message: '💬',
  'message-circle': '💬',
  scissors: '✂️',
  sparkles: '✨',
  info: 'ℹ️',
  'alert-triangle': '⚠️',
  'alert-circle': '⚠️',
  layers: '📑',
  activity: '📊',
  trending: '📈',
  'trending-up': '📈',
  home: '🏠',
  menu: '☰',
  more: '⋯',
  // 植物相关
  'plant-pot': '🪴',
  sprout: '🌱',
  tree: '🌳',
  // 天气/环境
  'sun-horizon': '🌅',
  moon: '🌙',
  cloud: '☁️',
  umbrella: '☂️',
  stethoscope: '🩺',
  quote: '💬',
  lightbulb: '💡',
  'edit-2': '✏️',
  'message-circle': '💬',
  'circle': '⚪',
  thermometer: '🌡️',
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 24, color = '#000' }: IconProps) {
  const emoji = iconEmojiMap[name];

  if (emoji) {
    return (
      <Text style={[styles.emoji, { fontSize: size }]}>
        {emoji}
      </Text>
    );
  }

  // 默认返回空心圆
  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color,
        },
      ]}
    />
  );
}

// 导出预定义图标组件列表，方便直接导入使用
export const Icons = {
  Camera: (props: Omit<IconProps, 'name'>) => <Icon name="camera" {...props} />,
  Image: (props: Omit<IconProps, 'name'>) => <Icon name="image" {...props} />,
  Flower2: (props: Omit<IconProps, 'name'>) => <Icon name="flower2" {...props} />,
  BookOpen: (props: Omit<IconProps, 'name'>) => <Icon name="book-open" {...props} />,
  User: (props: Omit<IconProps, 'name'>) => <Icon name="user" {...props} />,
  Search: (props: Omit<IconProps, 'name'>) => <Icon name="search" {...props} />,
  Settings: (props: Omit<IconProps, 'name'>) => <Icon name="settings" {...props} />,
  HelpCircle: (props: Omit<IconProps, 'name'>) => <Icon name="help" {...props} />,
  Star: (props: Omit<IconProps, 'name'>) => <Icon name="star" {...props} />,
  Clock: (props: Omit<IconProps, 'name'>) => <Icon name="clock" {...props} />,
  Bell: (props: Omit<IconProps, 'name'>) => <Icon name="bell" {...props} />,
  Droplets: (props: Omit<IconProps, 'name'>) => <Icon name="droplets" {...props} />,
  Sun: (props: Omit<IconProps, 'name'>) => <Icon name="sun" {...props} />,
  CloudRain: (props: Omit<IconProps, 'name'>) => <Icon name="cloud-rain" {...props} />,
  Snowflake: (props: Omit<IconProps, 'name'>) => <Icon name="snowflake" {...props} />,
  Plus: (props: Omit<IconProps, 'name'>) => <Icon name="plus" {...props} />,
  X: (props: Omit<IconProps, 'name'>) => <Icon name="x" {...props} />,
  Check: (props: Omit<IconProps, 'name'>) => <Icon name="check" {...props} />,
  ArrowLeft: (props: Omit<IconProps, 'name'>) => <Icon name="arrow-left" {...props} />,
  ArrowRight: (props: Omit<IconProps, 'name'>) => <Icon name="arrow-right" {...props} />,
  ChevronRight: (props: Omit<IconProps, 'name'>) => <Icon name="chevron-right" {...props} />,
  ChevronLeft: (props: Omit<IconProps, 'name'>) => <Icon name="chevron-left" {...props} />,
  Loader2: (props: Omit<IconProps, 'name'>) => <Icon name="loader" {...props} />,
  Calendar: (props: Omit<IconProps, 'name'>) => <Icon name="calendar" {...props} />,
  Share2: (props: Omit<IconProps, 'name'>) => <Icon name="share" {...props} />,
  Heart: (props: Omit<IconProps, 'name'>) => <Icon name="heart" {...props} />,
  MessageCircle: (props: Omit<IconProps, 'name'>) => <Icon name="message-circle" {...props} />,
  Scissors: (props: Omit<IconProps, 'name'>) => <Icon name="scissors" {...props} />,
  Sparkles: (props: Omit<IconProps, 'name'>) => <Icon name="sparkles" {...props} />,
  AlertTriangle: (props: Omit<IconProps, 'name'>) => <Icon name="alert-triangle" {...props} />,
  AlertCircle: (props: Omit<IconProps, 'name'>) => <Icon name="alert-circle" {...props} />,
  Layers: (props: Omit<IconProps, 'name'>) => <Icon name="layers" {...props} />,
  Activity: (props: Omit<IconProps, 'name'>) => <Icon name="activity" {...props} />,
  TrendingUp: (props: Omit<IconProps, 'name'>) => <Icon name="trending-up" {...props} />,
  SunMedium: (props: Omit<IconProps, 'name'>) => <Icon name="sun-medium" {...props} />,
  Info: (props: Omit<IconProps, 'name'>) => <Icon name="info" {...props} />,
  Home: (props: Omit<IconProps, 'name'>) => <Icon name="home" {...props} />,
  Stethoscope: (props: Omit<IconProps, 'name'>) => <Icon name="stethoscope" {...props} />,
  Lightbulb: (props: Omit<IconProps, 'name'>) => <Icon name="lightbulb" {...props} />,
  Edit2: (props: Omit<IconProps, 'name'>) => <Icon name="edit-2" {...props} />,
  Thermometer: (props: Omit<IconProps, 'name'>) => <Icon name="thermometer" {...props} />,
  Circle: (props: Omit<IconProps, 'name'>) => <Icon name="circle" {...props} />,
  Quote: (props: Omit<IconProps, 'name'>) => <Icon name="quote" {...props} />,
};

// 导出专用于 emoji 的组件，供需要直接显示 emoji 的场景使用
export const EmojiIcon = ({ emoji, size = 24 }: { emoji: string; size?: number }) => (
  <Text style={{ fontSize: size }}>{emoji}</Text>
);

const styles = StyleSheet.create({
  emoji: {
    textAlign: 'center',
  },
  fallback: {
    backgroundColor: 'transparent',
  },
});

export default Icon;
