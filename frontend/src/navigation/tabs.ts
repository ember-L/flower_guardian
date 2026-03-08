import React from 'react';
import { Home, Flower2, BookOpen, User } from 'lucide-react-native';
import { colors } from '../constants/theme';

export type TabParamList = {
  Identify: undefined;
  Garden: undefined;
  Encyclopedia: undefined;
  Profile: undefined;
};

export const tabs = [
  {
    name: 'Identify' as const,
    title: '识别',
    icon: Home,
    iconActive: Home,
  },
  {
    name: 'Garden' as const,
    title: '花园',
    icon: Flower2,
    iconActive: Flower2,
  },
  {
    name: 'Encyclopedia' as const,
    title: '百科',
    icon: BookOpen,
    iconActive: BookOpen,
  },
  {
    name: 'Profile' as const,
    title: '我的',
    icon: User,
    iconActive: User,
  },
];

export const activeColor = colors.primary;
export const inactiveColor = colors['text-light'];
