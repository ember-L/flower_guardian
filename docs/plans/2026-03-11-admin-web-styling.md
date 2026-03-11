# 管理员后台美化工方案

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** 使用 Tailwind CSS 对管理员后台进行美化，采用护花使者品牌主题色（珊瑚红 #f46）。

**Architecture:** 保持现有页面结构，优化配色和样式。

**Tech Stack:** Next.js 14 + Tailwind CSS

---

## 任务清单

### Task 1: 配置主题色和全局样式

**Files:**
- Modify: `web/src/app/globals.css`

**Step 1: 添加自定义颜色**

```css
/* web/src/app/globals.css */
@theme {
  --color-primary: #f46;
  --color-primary-dark: #e6335c;
  --color-primary-light: #ff6b88;
  --color-dark-bg: #1a1a2e;
  --color-dark-hover: #16213e;
}
```

---

### Task 2: 美化登录页

**Files:**
- Modify: `web/src/app/admin/login/page.tsx`

**修改内容：**
- 渐变背景
- 品牌 Logo
- 输入框样式
- 按钮样式

---

### Task 3: 美化侧边栏导航

**Files:**
- Modify: `web/src/app/admin/layout.tsx`

**修改内容：**
- 深色背景
- 品牌区域
- 导航项图标
- 悬停效果
- 退出按钮样式

---

### Task 4: 美化仪表盘

**Files:**
- Modify: `web/src/app/admin/dashboard/page.tsx`

**修改内容：**
- 统计卡片样式
- 颜色区分
- 阴影效果

---

### Task 5: 美化列表页面

**Files:**
- Modify: `web/src/app/admin/products/page.tsx`
- Modify: `web/src/app/admin/orders/page.tsx`
- Modify: `web/src/app/admin/users/page.tsx`
- Modify: `web/src/app/admin/plants/page.tsx`

**修改内容：**
- 表格样式
- 按钮样式
- 卡片样式

---

### Task 6: 美化统计页面

**Files:**
- Modify: `web/src/app/admin/stats/page.tsx`

**修改内容：**
- 指标卡片样式
- 图表样式
- 排行榜样式

---

## 实施顺序

1. Task 1: 主题配置
2. Task 2: 登录页
3. Task 3: 侧边栏
4. Task 4: 仪表盘
5. Task 5: 列表页面
6. Task 6: 统计页面
