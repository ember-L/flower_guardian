const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 配置 Metro 忽略嵌套的 node_modules
config.resolver = {
  ...config.resolver,
  // 不从嵌套 node_modules 解析
  extraNodeModules: {},
};

module.exports = config;
