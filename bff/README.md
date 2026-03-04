# 苏超智能化指挥中心 - BFF中台服务

> **Backend For Frontend (BFF) 架构中间层**
> 
> 职责：聚合底层多数据源，为前端P0-P3四大视图提供结构化API

---

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      前端层 (Vue 3)                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  P0视图 │  │  P1视图 │  │  P2视图 │  │  P3视图 │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
└───────┼────────────┼────────────┼────────────┼─────────────┘
        │            │            │            │
        └────────────┴──────┬─────┴────────────┘
                            │
                    ┌───────▼───────┐
                    │   BFF中台层   │
                    │  (本服务)     │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
   │ MAE网管 │        │SEQ信令  │        │DSP智能板│
   │(15分钟) │        │(小时级) │        │(实时)   │
   └─────────┘        └─────────┘        └─────────┘
```

---

## 📁 目录结构

```
bff/
├── server.js              # 入口文件
├── package.json           # 依赖配置
├── README.md              # 本文件
├── routes/                # 路由层
│   └── p2.js              # P2场内微观路由
├── services/              # 业务逻辑层
│   └── p2Service.js       # P2数据聚合服务
└── data/                  # 本地模拟数据源(V6物理表)
    ├── MAE_PERF_15MIN.json
    ├── SEQ_DEVICE_HOURLY.json
    ├── DSP_KQI_15MIN.json
    └── MANUAL_CAPACITY_CONFIG.json
```

---

## 🚀 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 开发模式（热更新）
npm run dev

# 3. 生产模式
npm start
```

服务启动后访问：http://localhost:3000

---

## 📡 API列表

### 健康检查
- `GET /health` - 服务健康状态

### P2 场内微观视图
- `GET /api/v1/p2/health` - P2服务健康检查
- `GET /api/v1/p2/zones` - 获取所有防线区列表
- `GET /api/v1/p2/indoor-micro?zone=南看台F区` - 获取场内微观聚合数据

---

## 🔗 前端联调指南

详见根目录文档：`../BFF_MIGRATION.md`

---

## 📊 数据血缘

BFF聚合的数据源对应数据血缘表V6版本：

| BFF数据源文件 | 对应V6物理表 | 系统 | 颗粒度 |
|--------------|-------------|------|--------|
| `MAE_PERF_15MIN.json` | MAE_PERF_15MIN | MAE网管 | 15分钟 |
| `SEQ_DEVICE_HOURLY.json` | SEQ_DEVICE_HOURLY | SEQ信令 | 小时级 |
| `DSP_KQI_15MIN.json` | DSP_KQI_15MIN | DSP智能板 | 15分钟 |
| `MANUAL_CAPACITY_CONFIG.json` | MANUAL_CAPACITY_CONFIG | 人工维护 | 静态 |

---

## 🛠️ 技术栈

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Middleware**: CORS
- **DevTools**: Nodemon

---

## 📄 License

MIT License - 江苏移动网络部
