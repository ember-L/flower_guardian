// UI Kitten 主题入口
// 合并自定义主题与 Eva 设计系统

import * as Eva from '@eva-design/eva';
import { lightTheme } from './mappings';

// 导出合并后的主题
export const theme = {
  ...Eva.light,
  ...lightTheme,
};

// 导出映射配置供其他文件使用
export { lightTheme };
