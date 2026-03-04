# P2 场内微观视图 - BFF 数据绑定改造文档

## 改造概览

将 P2 页面从静态 Mock 数据迁移到真实 BFF API 数据，实现 15 秒自动轮询和动态刷新。

## 文件变更清单

### 1. 新增 API 客户端
**文件**: `src/api/p2.js`
- BFF 基础地址: `http://localhost:3000/api/v1`
- 请求超时: 10 秒
- 兜底数据: 当 API 失败时使用本地 fallback 数据
- 导出函数: `fetchP2IndoorMicroData()`, `fetchP2Zones()`

### 2. 主容器改造
**文件**: `src/pages/P2/VenueMicro.jsx`
- 新增状态: `p2GlobalData`, `isLoading`, `isError`, `lastUpdateTime`
- 15 秒轮询: `setInterval(fetchData, 15000)`
- 内存管理: `clearInterval` 在组件卸载时清理
- 错误处理: Loading 遮罩 + Error 遮罩 + 重试机制

### 3. 左侧面板改造
**文件**: `src/pages/P2/LeftPanelP2.jsx`
- **PyramidFunnel**: 绑定 `data.userTiers` 金字塔数据
- **CapacityAgent**: 绑定 `data.capacity.saturation` 饱和度数据
- **TerminalAnalysis**: 绑定 `data.terminals` 终端排行数据

### 4. 右侧面板改造
**文件**: `src/pages/P2/RightPanelP2.jsx`
- **RadarExperience**: 绑定 `data.experienceRadar` 雷达图数据
  - 使用 `useRef` + `setOption` 实现增量更新
  - `notMerge={false}` 避免图表重绘
- **AppKQIGrid**: 绑定 `data.basicKqi` 业务 KQI 数据
- **DiagnosticsAlerts**: 绑定 `data.alarms` 告警数据

### 5. 中央舞台改造
**文件**: `src/pages/P2/CenterStage.jsx`
- **TopInfoBar**: 绑定 `data.userTiers` 统计 + `data.capacity` 网络状态
- **ZoneProfileModal**: 绑定数据到区域画像弹窗

### 6. BFF 服务更新
**文件**: `bff/services/p2Service.js`
- `experienceRadar` 格式: `{vip: [...], normal: [...], indicators: [...]}`
- `basicKqi` 格式: `{wechat: {...}, douyin: {...}, game: {...}, payment: {...}}`
- 新增字段: `alarms`, `meta`

## 数据流架构

```
┌─────────────────────────────────────────────────────────────┐
│                      BFF 中台服务                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ MAE_PERF_15MIN│ │SEQ_DEVICE_HOURLY│ │DSP_KQI_15MIN │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│           │              │              │                   │
│           └──────────────┼──────────────┘                   │
│                          ▼                                  │
│              ┌─────────────────────┐                        │
│              │   p2Service.js      │  聚合4张物理表          │
│              │   /p2/indoor-micro  │                        │
│              └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP GET localhost:3000
                              │ 15秒轮询
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      前端 React 应用                         │
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │   VenueMicro    │────│    p2.js API    │                 │
│  │   (State管理)   │    │   (数据获取)    │                 │
│  └────────┬────────┘    └─────────────────┘                 │
│           │                                                  │
│     ┌─────┼─────┐                                            │
│     │     │     │                                            │
│     ▼     ▼     ▼                                            │
│ ┌────────┐┌────────┐┌────────┐                              │
│ │ Left   ││ Center ││ Right  │                              │
│ │ Panel  ││ Stage  ││ Panel  │                              │
│ └────────┘└────────┘└────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

## 数据格式规范

### userTiers (金字塔漏斗)
```javascript
[
  { label: '场馆包用户', value: 3200, color: '#FFD700', width: '35%' },
  { label: '钻/白金卡', value: 8500, color: '#C0C0C0', width: '55%' },
  { label: '普通用户', value: 36800, color: '#00F0FF', width: '85%' }
]
```

### capacity.saturation (容量评估)
```javascript
{
  currentRate: 80.8,        // 当前使用率 %
  capacity: 60000,          // 总容量
  currentUsers: 48500,      // 当前用户数
  status: 'caution',        // normal/caution/warning/critical
  remaining: 11500,         // 剩余容量
  saturationLevel: 'medium' // low/medium/high
}
```

### terminals (终端分析)
```javascript
{
  total5GARatio: 68.5,
  ranking: [
    { rank: 1, brand: '华为', model: 'Mate60 Pro', capability: '5G-A', ... }
  ]
}
```

### experienceRadar (体验雷达图)
```javascript
{
  vip: [850, 95, 98, 100, 95],    // [下行速率, 语音清晰, 视频卡顿, 直播上行, 低时延]
  normal: [400, 80, 75, 85, 70],
  indicators: [
    { name: '下行速率', max: 1000 },
    { name: '语音清晰', max: 100 },
    // ...
  ]
}
```

### basicKqi (基础业务KQI)
```javascript
{
  wechat: { delay: 20, successRate: 99.2, ulRate: 12.5 },
  douyin: { definition: '高清', bitrate: 15000, firstFrame: 180 },
  game: { latency: 38 },
  payment: { success: 99.9 }
}
```

## 启动方式

```bash
# 方式1: 一键启动（推荐）
start-all.bat

# 方式2: 手动分别启动
# 终端1: 启动前端
npm run dev

# 终端2: 启动BFF服务
npm run bff
```

## 验证检查点

1. **BFF服务**: http://localhost:3000/health 返回 `{"status":"ok"}`
2. **API端点**: http://localhost:3000/api/v1/p2/indoor-micro?zone=南看台F区
3. **前端页面**: http://localhost:5173/p2 加载后显示"最后更新"时间戳
4. **网络面板**: DevTools Network 每15秒看到新的 API 请求

## 故障排查

| 现象 | 原因 | 解决方案 |
|------|------|----------|
| 页面显示"加载中" | BFF未启动 | 运行 `npm run bff` |
| 数据不更新 | 轮询失败 | 检查浏览器控制台网络请求 |
| 图表不刷新 | ECharts实例问题 | 检查 notMerge 和 lazyUpdate 设置 |
| 内存泄漏 | Interval未清理 | 确认组件卸载时 clearInterval |

## 性能优化

1. **ECharts**: 使用 `notMerge={false}` + `lazyUpdate={true}` 避免重绘
2. **轮询**: 静默更新时不显示 loading 状态
3. **Fallback**: API 失败时无缝切换到本地数据
