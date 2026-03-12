# 🌐 Web - Next.js 管理后台

护花使者管理后台，采用 Next.js 14 和 Tailwind CSS v4 开发。

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-cyan)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm / yarn / pnpm

### 安装依赖

```bash
cd web

# 安装项目依赖
npm install

# 或使用 yarn
yarn install
```

### 运行开发服务器

```bash
# 开发模式
npm run dev

# 生产构建
npm run build
npm start
```

### 访问后台

```
http://localhost:3000/admin
```

## 📁 项目结构

```
web/
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── admin/         # 管理后台页面
│   │   │   ├── dashboard/   # 📊 仪表盘
│   │   │   ├── plants/      # 🌱 植物管理
│   │   │   ├── products/    # 🛍️ 商品管理
│   │   │   ├── orders/      # 📦 订单管理
│   │   │   └── users/       # 👥 用户管理
│   │   ├── api/           # API 路由
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/        # 可复用组件
│   ├── lib/              # 工具函数
│   └── styles/           # 样式文件
├── public/                # 静态资源
├── tailwind.config.ts    # Tailwind 配置
├── tsconfig.json
└── package.json
```

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| ⚛️ Next.js 14 | React 框架 |
| 🎨 Tailwind CSS v4 | 样式系统 |
| 📘 TypeScript | 类型安全 |
| 📊 Chart.js | 数据可视化 |
| 🔐 NextAuth.js | 认证 |

## 📱 响应式设计

管理后台支持桌面端和平板设备访问，适配不同屏幕尺寸。

## 🔐 认证与权限

- 管理员登录
- JWT Token 认证
- 角色权限控制 (admin/user)

## 📊 功能模块

| 模块 | 功能 |
|------|------|
| 📊 仪表盘 | 数据统计概览 |
| 🌱 植物管理 | 添加/编辑/删除植物 |
| 🛍️ 商品管理 | 商品上下架、库存管理 |
| 📦 订单管理 | 订单处理、发货 |
| 👥 用户管理 | 用户列表、角色管理 |

## 🎨 设计风格

- 🎯 简洁现代的 UI 设计
- 🎭 统一的组件风格
- 🌈 柔和的配色方案
- 📱 响应式布局

## 📄 许可证

MIT License

---

<p align="center">
  🌻 护花使者管理后台 🌻
</p>
