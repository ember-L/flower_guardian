# Frontend Dockerfile - Development Mode
# 使用 React Native CLI 项目

FROM node:20-alpine

# 安装必要的系统依赖
RUN apk add --no-cache \
    watchman \
    ruby \
    gem \
    bundler \
    autoconf \
    automake \
    libtool \
    pkgconfig \
    rgb \
    zlib \
    jpeg-dev \
    png-dev \
    giflib-dev \
    imagemagick

WORKDIR /app

# 复制package文件
COPY frontend/package*.json ./

# 安装npm依赖
RUN npm install

# 复制应用代码
COPY frontend/ ./

# 安装Ruby依赖（iOS开发需要）
RUN cd ios && bundle install

# 安装CocoaPods依赖
RUN cd ios && pod install

# 环境变量
ENV NODE_ENV=development
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

# 暴露端口
EXPOSE 3000

# 启动命令 - 运行 Metro bundler
CMD ["npm", "start", "--", "--reset-cache"]
