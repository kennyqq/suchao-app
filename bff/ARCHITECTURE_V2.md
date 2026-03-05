# BFF 中台架构 V2 - Output模式与人工干预

## 架构概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            BFF 中台架构 V2                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         Data Layer (数据源层)                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │   │
│  │  │   static/   │  │   hourly/   │  │         15min/          │ │   │
│  │  │             │  │             │  │                         │ │   │
│  │  │ • MANUAL_*  │  │ • SEQ_DEVICE│  │ • MAE_PERF_15MIN        │ │   │
│  │  │ • SEQ_USER  │  │ • SEQ_USER  │  │ • DSP_KQI_15MIN         │ │   │
│  │  │   _PROFILE  │  │             │  │ • AUTIN_ALARM_REALTIME  │ │   │
│  │  │             │  │             │  │                         │ │   │
│  │  │ (极少变更)   │  │ (小时刷新)   │  │ (15分钟刷新)            │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓ cron.js 定时聚合                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Aggregation Layer (聚合层)                   │   │
│  │                                                                 │   │
│  │  bff/cron.js (每15秒执行)                                        │   │
│  │  ├── 读取 data/* 各频段数据                                       │   │
│  │  ├── 调用 p0Service~p3Service 聚合逻辑                            │   │
│  │  └── fs.writeFileSync 写入 output/                               │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓ 物理落盘                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       Output Layer (输出层)                      │   │
│  │                                                                 │   │
│  │  bff/output/                                                    │   │
│  │  ├── p0_data.json    ← 宏观溯源视图数据                          │   │
│  │  ├── p1_data.json    ← 全局态势视图数据                          │   │
│  │  ├── p2_data.json    ← 场内微观视图数据  ★★★ 人工干预入口       │   │
│  │  └── p3_data.json    ← 评估闭环视图数据                          │   │
│  │                                                                 │   │
│  │  💡 人工干预：直接修改这些 JSON 文件可立即生效                    │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓ fs.readFileSync                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        API Layer (接口层)                        │   │
│  │                                                                 │   │
│  │  bff/routes/*.js                                                │   │
│  │  ├── p0.js  → GET /api/v1/p0/data                               │   │
│  │  ├── p1.js  → GET /api/v1/p1/data                               │   │
│  │  ├── p2.js  → GET /api/v1/p2/indoor-micro                       │   │
│  │  └── p3.js  → GET /api/v1/p3/data                               │   │
│  │                                                                 │   │
│  │  特点：纯静态文件搬运工，不再实时计算                              │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 目录结构

```
bff/
├── data/                          # 底层数据源（按刷新频率分层）
│   ├── static/                    # 静态配置（极少变更）
│   │   ├── MANUAL_CELL_CONFIG.json
│   │   ├── MANUAL_CAPACITY_CONFIG.json
│   │   ├── MANUAL_POST_MATCH_SUMMARY.json
│   │   └── SEQ_USER_PROFILE_DAILY.json
│   ├── hourly/                    # 小时级数据
│   │   ├── SEQ_DEVICE_HOURLY.json
│   │   └── SEQ_USER_HOURLY.json
│   └── 15min/                     # 15分钟级数据
│       ├── MAE_PERF_15MIN.json
│       ├── DSP_KQI_15MIN.json
│       └── AUTIN_ALARM_REALTIME.json
├── output/                        # ★★★ 聚合输出层（支持人工干预）
│   ├── p0_data.json
│   ├── p1_data.json
│   ├── p2_data.json               ← 常用干预目标
│   └── p3_data.json
├── services/                      # 聚合服务层
│   ├── p0Service.js
│   ├── p1Service.js
│   ├── p2Service.js
│   └── p3Service.js
├── routes/                        # API路由层（Output模式）
│   ├── p0.js
│   ├── p1.js
│   ├── p2.js
│   └── p3.js
├── cron.js                        # 定时聚合引擎
└── server.js                      # 服务入口
```

## 核心变更

### 1. 数据源分层
按刷新频率将 9 张物理表分类存储：
- **static/**: 人工配置，极少变更
- **hourly/**: 小时级刷新
- **15min/**: 15分钟级刷新

### 2. Output 输出层
- 存放经过聚合后的最终前端视图数据
- **人工干预入口**: 客户可直接修改 `output/*.json` 实现数据强制覆盖
- API 层只读取 output 文件，不再实时计算

### 3. 定时聚合引擎 (cron.js)
- 每 15 秒执行一次（模拟生产环境 5 分钟）
- 读取 data/ 分层数据 → 调用 Service 聚合 → 写入 output/
- 原子写入：先写 .tmp 临时文件，再 rename 覆盖

### 4. API 层改造
- 废弃即时计算
- 改为 `fs.readFileSync` 读取 `output/*.json`
- 纯静态文件搬运工，支持人工干预

## 人工干预指南

### 场景 1: 快速修复数据异常
```bash
# 直接编辑 output 文件
vim bff/output/p2_data.json

# 修改后保存，API 立即生效（无需重启服务）
```

### 场景 2: 演示数据调整
```bash
# 临时修改人数为指定值
# 编辑 bff/output/p2_data.json:
# {
#   "data": {
#     "userTiers": [
#       { "value": 99999 },  // ← 改成夸张数字
#       ...
#     ]
#   }
# }
```

### 场景 3: 紧急降级
```bash
# 当底层数据源异常时，直接修改 output 文件
# 保证前端有数据可展示（哪怕是静态数据）
```

## 启动方式

```bash
# 开发模式（自动启动 cron 定时任务）
npm run dev

# 或分别启动
node bff/server.js      # BFF API 服务
node bff/cron.js        # 单独启动定时聚合（可选）
```

## API 端点

| 视图 | 端点 | 说明 |
|------|------|------|
| P0 宏观溯源 | `GET /api/v1/p0/data` | 读取 output/p0_data.json |
| P1 全局态势 | `GET /api/v1/p1/data` | 读取 output/p1_data.json |
| P2 场内微观 | `GET /api/v1/p2/indoor-micro?zone=xxx` | 读取 output/p2_data.json |
| P3 评估闭环 | `GET /api/v1/p3/data` | 读取 output/p3_data.json |
| 健康检查 | `GET /health` | 服务状态 |
| 输出文件信息 | `GET /api/v1/p2/output-info` | 获取 output 文件元信息 |

## 日志标识

```
[Cron]   → 定时聚合任务日志
[P2Service] → 数据聚合服务日志
[P2 Router] → API 路由层日志
```
