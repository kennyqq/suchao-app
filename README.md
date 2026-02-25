# 苏超智能化指挥中心

江苏超级联赛智能化指挥中心 - 数据可视化大屏应用。

![版本](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Vite](https://img.shields.io/badge/Vite-7-646CFF)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC)

## 📸 项目预览

本项目是一个基于 React + Vite 的数据可视化大屏应用，用于江苏超级联赛（足球）的智能化指挥调度。

### 四大核心视图

| 视图 | 功能描述 | 技术亮点 |
|------|----------|----------|
| **P0 宏观溯源** | 全国/江苏省球迷迁徙态势感知 | ECharts 迁徙地图、热力图 |
| **P1 全局防御** | 5G-A 基站网络态势实时监控 | AntV L7 3D 地图、四色防御圈 |
| **P2 场内微观** | 场馆内部微观监控 | 用户分层金字塔、智能体评估 |
| **P3 评估闭环** | 赛后评估与复盘 | 全息战报、VIP 体验对比 |

## 🚀 一键启动指南

### 前置要求

- **Node.js**: >= 18.0.0 ([下载安装](https://nodejs.org/))
- **npm**: >= 9.0.0 (随 Node.js 自动安装)

> 验证安装：打开终端运行 `node -v` 和 `npm -v`，能看到版本号即表示安装成功。

### 第一步：解压项目

将 `suchao-app.zip` 解压到你电脑的任意位置，例如 `D:\projects\suchao-app`

### 第二步：安装依赖

```bash
# 进入项目目录
cd suchao-app

# 安装所有依赖（国内用户可使用 npm install --registry=https://registry.npmmirror.com）
npm install
```

> 💡 安装过程大约需要 1-3 分钟，取决于网络速度。

### 第三步：配置环境变量

```bash
# 复制示例配置文件
cp .env.example .env

# Windows 用户请使用以下命令：
copy .env.example .env
```

然后编辑 `.env` 文件，填入你的高德地图 API Key：

```env
VITE_AMAP_KEY=your_amap_key_here
VITE_AMAP_SECURITY_CODE=your_amap_security_code_here
```

> 🔑 **如何获取高德地图 Key？**
> 1. 访问 [高德地图开发者控制台](https://console.amap.com)
> 2. 注册/登录账号
> 3. 创建新应用，选择「Web 端 (JS API)」
> 4. 复制 Key 和安全密钥到 `.env` 文件

### 第四步：启动项目

```bash
npm run dev
```

看到以下提示即表示启动成功：

```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
  ➜  press h + enter to show help
```

现在打开浏览器访问 **http://localhost:3000** 即可使用！

### 第五步：切换视图

应用默认打开 P0 宏观溯源视图，点击顶部导航栏可切换：

- **宏观溯源** - 球迷迁徙态势
- **全局态势** - 5G-A 网络监控
- **场内微观** - 场馆内部监控
- **评估闭环** - 赛后评估报告

## 📦 构建生产版本

```bash
# 构建生产环境代码
npm run build

# 预览生产构建
npm run preview
```

构建后的文件位于 `dist/` 目录，可直接部署到 Vercel、Netlify 等平台。

## 🏗️ 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| **框架** | React | 19.x |
| **路由** | React Router | 7.x |
| **构建工具** | Vite | 7.x |
| **样式** | Tailwind CSS | 4.x |
| **动效** | Framer Motion | 12.x |
| **地图** | 高德 JS API + AntV L7 | 2.x |
| **图表** | ECharts | 6.x |
| **图标** | Lucide React | 0.x |

## 📁 项目结构

```
suchao-app/
├── public/                     # 静态资源
│   ├── china.json             # 中国地图 GeoJSON
│   ├── jiangsu.json           # 江苏地图 GeoJSON
│   ├── stadium-bg.jpg         # 场馆背景图
│   └── city_night_top_view.jpg # 城市夜景图
├── src/
│   ├── components/            # 全局组件
│   │   ├── Header.jsx         # 顶部导航
│   │   ├── TimelineV3.jsx     # 底部时间轴
│   │   ├── MacroMigrationMap.jsx  # P0 迁徙地图
│   │   └── CyberBorder.jsx    # 赛博边框效果
│   ├── pages/                 # 页面组件
│   │   ├── P1/               # 全局防御视图
│   │   │   ├── AmapL7Scene.jsx
│   │   │   ├── LeftPanelP1.jsx
│   │   │   └── RightPanelP1.jsx
│   │   ├── P2/               # 场内微观视图
│   │   │   ├── VenueMicro.jsx
│   │   │   ├── LeftPanelP2.jsx
│   │   │   ├── RightPanelP2.jsx
│   │   │   └── components/   # P2 子组件
│   │   └── P3/               # 评估闭环视图
│   │       ├── EvaluationView.jsx
│   │       ├── components/   # P3 子组件
│   │       └── ...
│   ├── styles/               # 全局样式
│   │   ├── index.css
│   │   └── App.css
│   ├── config/               # 配置文件
│   │   ├── amap.config.js
│   │   └── map.config.js
│   ├── App.jsx              # 根组件
│   └── main.jsx             # 入口文件
├── .env.example             # 环境变量示例
├── .env                     # 环境变量（需自行创建）
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md                # 本文件
```

## 🌐 路由说明

| 路径 | 视图 | 描述 |
|------|------|------|
| `/` 或 `/p0` | 宏观溯源 | 默认视图，球迷迁徙态势感知 |
| `/p1` | 全局态势 | 5G-A 基站网络态势监控 |
| `/p2` | 场内微观 | 场馆内部微观监控与智能体 |
| `/p3` | 评估闭环 | 赛后评估总结与复盘 |

## ⚙️ 环境变量

| 变量名 | 必填 | 描述 |
|--------|------|------|
| `VITE_AMAP_KEY` | ✅ | 高德地图 API Key |
| `VITE_AMAP_SECURITY_CODE` | ✅ | 高德地图安全密钥 |
| `VITE_APP_TITLE` | ❌ | 应用标题（默认：苏超智能化指挥中心） |
| `VITE_APP_VERSION` | ❌ | 应用版本 |

## 🛠️ 常见问题

### Q1: npm install 安装失败？

**A**: 项目已配置 `.npmrc` 使用 `legacy-peer-deps`，如果仍失败，尝试：
```bash
npm install --legacy-peer-deps
```

### Q2: 地图显示黑屏/空白？

**A**: 请检查：
1. `.env` 文件是否正确配置高德地图 Key
2. 浏览器控制台是否有 CORS 错误
3. 高德 Key 的「Web 端 (JS API)」服务是否已开启

### Q3: 如何修改端口号？

**A**: 修改 `vite.config.js`：
```javascript
export default defineConfig({
  server: {
    port: 3000,  // 修改此处
  },
})
```

### Q4: 项目支持手机访问吗？

**A**: 本项目为大屏设计，建议 1920x1080 分辨率使用。移动端仅支持基础浏览。

## 🔒 安全注意事项

⚠️ **重要**: 永远不要将 `.env` 文件提交到代码仓库！

- 所有敏感配置（API Key）使用环境变量
- `.env` 已添加到 `.gitignore`
- 生产环境使用 CI/CD 注入环境变量

## 📄 许可证

私有项目 - 江苏超级联赛组委会

## 🤝 技术支持

如有问题，请联系项目维护团队。

---

** Made with ❤️ by 江苏超级联赛技术团队 **
