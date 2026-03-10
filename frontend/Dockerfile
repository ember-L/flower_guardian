# Frontend Dockerfile - Production with Nginx
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 Expo CLI 全局
RUN npm install -g expo expo-cli

# 复制package文件
COPY frontend/package*.json ./

# 安装依赖
RUN npm install

# 复制应用代码
COPY frontend/ ./

# 构建 Web 版本
RUN npx expo export:web --output-dir dist

# Nginx 阶段
FROM nginx:alpine AS runner

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
