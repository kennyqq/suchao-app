# P2 场内微观视图 - 组件数据源映射文档

## 数据流总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BFF 数据层 (Backend)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐    │
│  │ MAE_PERF_15MIN.json│  │SEQ_DEVICE_HOURLY   │  │ DSP_KQI_15MIN.json │    │
│  │ 无线网络管平台     │  │.json               │  │ 无线智能板         │    │
│  │ (基站性能指标)     │  │ (终端统计)         │  │ (业务质量KQI)      │    │
│  └────────┬───────────┘  └────────┬───────────┘  └────────┬───────────┘    │
│           │                       │                       │                │
│           └───────────────────────┼───────────────────────┘                │
│                                   │                                        │
│  ┌────────────────────────────────┴────────────────────────────────┐      │
│  │                    MANUAL_CAPACITY_CONFIG.json                   │      │
│  │                      (人工容量配置-静态)                          │      │
│  └────────────────────────────────┬────────────────────────────────┘      │
│                                   │                                        │
│                                   ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐      │
│  │                     p2Service.js 聚合层                          │      │
│  │              将4张物理表聚合成统一JSON结构                        │      │
│  └────────────────────────────────┬────────────────────────────────┘      │
│                                   │                                        │
│                                   │ HTTP API                               │
│                                   │ /api/v1/p2/indoor-micro                │
└───────────────────────────────────┼────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          前端 React 组件层 (Frontend)                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      src/api/p2.js (API客户端)                       │    │
│  │              封装fetch请求 + Fallback兜底数据机制                     │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                  │                                          │
│                                  │ 通过 props.data 传递                      │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     VenueMicro.jsx (主容器)                          │   │
│  │              管理全局状态 + 15秒轮询 + 数据分发                        │   │
│  └──────────────┬────────────────────┬────────────────┬───────────────┘   │
│                 │                    │                │                   │
│                 ▼                    ▼                ▼                   │
│        ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│        │ LeftPanelP2  │    │ CenterStage  │    │ RightPanelP2 │          │
│        │   (左侧面板)  │    │   (中央舞台)  │    │   (右侧面板)  │          │
│        └──────┬───────┘    └──────┬───────┘    └──────┬───────┘          │
│               │                   │                   │                  │
│     ┌─────────┼─────────┐         │         ┌─────────┼─────────┐        │
│     ▼         ▼         ▼         ▼         ▼         ▼         ▼        │
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐  │
│ │Pyramid│ │Capacity│ │Terminal│ │TopInfo│ │Radar  │ │AppKQI │ │Alerts │  │
│ │Funnel │ │Agent  │ │Analysis│ │Bar    │ │Chart  │ │Grid   │ │       │  │
│ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 一、BFF 物理表（数据源）

### 1. MAE_PERF_15MIN.json
**路径**: `bff/data/MAE_PERF_15MIN.json`

| 字段 | 说明 | 映射前端字段 |
|------|------|-------------|
| `rrc_conn_users` | RRC连接用户数 | userTiers.total, capacity.saturation.currentUsers |
| `vip_rrc_users` | VIP用户RRC连接数 | userTiers[0].value + userTiers[1].value |
| `prb_util_dl` | 下行PRB利用率 | capacity.prbUtilization |
| `traffic_total_dl_mb` | 总下行流量(MB) | capacity.trafficToday |
| `zone_name` | 区域名称 | meta.zoneName |

**使用组件**: 
- `PyramidFunnel` (金字塔漏斗图)
- `CapacityAgent` (放号评估)
- `TopInfoBar` (顶部统计条)

---

### 2. SEQ_DEVICE_HOURLY.json
**路径**: `bff/data/SEQ_DEVICE_HOURLY.json`

| 字段 | 说明 | 映射前端字段 |
|------|------|-------------|
| `top_devices_json[].model` | 终端型号 | terminals.ranking[].model |
| `top_devices_json[].count` | 终端数量 | terminals.ranking[].count |
| `top_devices_json[].capability` | 终端能力(5G/5G-A) | terminals.ranking[].capability |

**使用组件**: 
- `TerminalAnalysis` (终端能力分析)

---

### 3. DSP_KQI_15MIN.json
**路径**: `bff/data/DSP_KQI_15MIN.json`

| 字段 | 说明 | 映射前端字段 |
|------|------|-------------|
| `ue_5ga_ratio` | 5G-A终端占比 | terminals.total5GARatio |
| `wx_msg_success_rate` | 微信消息成功率 | basicKqi.wechat.successRate |
| `wx_pic_ul_rate_mbps` | 微信图片上传速率 | basicKqi.wechat.ulRate |
| `dy_video_first_frame_delay_ms` | 抖音首帧时延 | basicKqi.douyin.firstFrame |
| `dy_video_freeze_rate` | 抖音卡顿率 | basicKqi.douyin.definition |
| `game_avg_delay_ms` | 游戏平均时延 | basicKqi.game.latency |
| `pay_scan_delay_ms` | 支付扫码时延 | basicKqi.payment.success |
| `live_hd_ul_peak_rate_mbps` | 直播高清上行峰值 | experienceRadar.normal[3] |

**使用组件**: 
- `RadarExperience` (体验雷达图)
- `AppKQIGrid` (基础业务保障)
- `TerminalAnalysis` (5G-A渗透率)

---

### 4. MANUAL_CAPACITY_CONFIG.json
**路径**: `bff/data/MANUAL_CAPACITY_CONFIG.json`

| 字段 | 说明 | 映射前端字段 |
|------|------|-------------|
| `cell_capacity_config` | 小区容量配置 | capacity.saturation.capacity |

**使用组件**: 
- `CapacityAgent` (容量使用率计算)
- `TopInfoBar` (网络状态评估)

---

## 二、前端组件数据映射

### 左侧面板 (LeftPanelP2.jsx)

#### 1. PyramidFunnel (分层分级用户-金字塔漏斗)
**读取数据**: `data.userTiers`

```javascript
// 数据源: MAE_PERF_15MIN.json
// 计算逻辑: p2Service.js > buildUserTierFunnel()
[
  { 
    label: '场馆包用户',      // 固定标签
    value: vip_rrc_users * 0.15,  // MAE.vip_rrc_users * 15%
    color: '#FFD700', 
    width: '35%' 
  },
  { 
    label: '钻/白金卡',       // 固定标签
    value: vip_rrc_users * 0.85,  // MAE.vip_rrc_users * 85%
    color: '#C0C0C0', 
    width: '55%' 
  },
  { 
    label: '普通用户',        // 固定标签
    value: rrc_conn_users - vip_rrc_users,  // MAE.rrc_conn_users - vip
    color: '#00F0FF', 
    width: '85%' 
  }
]
```

**原始JSON文件**: `bff/data/MAE_PERF_15MIN.json`

---

#### 2. CapacityAgent (放号评估智能体)
**读取数据**: `data.capacity.saturation`

```javascript
// 数据源: MAE_PERF_15MIN.json + MANUAL_CAPACITY_CONFIG.json
// 计算逻辑: p2Service.js > calculateSaturation()
{
  currentRate: 80.8,        // (rrc_conn_users / capacity) * 100
  capacity: 60000,          // MANUAL.cell_capacity_config
  currentUsers: 48500,      // MAE.rrc_conn_users
  status: 'caution',        // 根据currentRate计算
  remaining: 11500,         // capacity - currentUsers
  saturationLevel: 'medium'
}
```

**原始JSON文件**: 
- `bff/data/MAE_PERF_15MIN.json`
- `bff/data/MANUAL_CAPACITY_CONFIG.json`

---

#### 3. TerminalAnalysis (终端能力分析)
**读取数据**: `data.terminals`

```javascript
// 数据源: SEQ_DEVICE_HOURLY.json + DSP_KQI_15MIN.json
{
  total5GARatio: 68.5,      // DSP.ue_5ga_ratio
  ranking: [                // SEQ.top_devices_json 转换格式
    { rank: 1, brand: '华为', model: 'Mate60 Pro', capability: '5G-A' },
    { rank: 2, brand: 'Apple', model: 'iPhone 15 Pro Max', capability: '5G-A' },
    // ...
  ]
}
```

**原始JSON文件**: 
- `bff/data/SEQ_DEVICE_HOURLY.json` (终端排行)
- `bff/data/DSP_KQI_15MIN.json` (5G-A占比)

---

### 右侧面板 (RightPanelP2.jsx)

#### 4. RadarExperience (分层分级体验-雷达图)
**读取数据**: `data.experienceRadar`

```javascript
// 数据源: DSP_KQI_15MIN.json
// 计算逻辑: p2Service.js 根据KQI指标计算
{
  // [下行速率, 语音清晰, 视频卡顿, 直播上行, 低时延]
  vip: [850, 95, 98, 100, 95],    // VIP用户(基于DSP数据换算)
  normal: [400, 80, 75, 85, 70],  // 普通用户(基于DSP数据换算)
  indicators: [
    { name: '下行速率', max: 1000 },    // 对应 wx_pic_ul_rate_mbps
    { name: '语音清晰', max: 100 },     // 固定高值
    { name: '视频卡顿', max: 100 },     // 对应 dy_video_freeze_rate
    { name: '直播上行', max: 100 },     // 对应 live_hd_ul_peak_rate_mbps
    { name: '低时延', max: 100 }        // 对应 game_avg_delay_ms
  ]
}
```

**原始JSON文件**: `bff/data/DSP_KQI_15MIN.json`

---

#### 5. AppKQIGrid (基础业务保障)
**读取数据**: `data.basicKqi`

```javascript
// 数据源: DSP_KQI_15MIN.json 直接映射
{
  wechat: {
    delay: 20,              // wx_msg_success_rate 推导
    successRate: 99.2       // wx_msg_success_rate
  },
  douyin: {
    definition: '高清',      // dy_video_freeze_rate < 3 ? '高清' : '标清'
    bitrate: 15000          // 固定值
  },
  game: {
    latency: 38             // game_avg_delay_ms
  },
  payment: {
    success: 99.9           // pay_scan_delay_ms < 500 ? 99.9 : 98.5
  }
}
```

**原始JSON文件**: `bff/data/DSP_KQI_15MIN.json`

---

#### 6. DiagnosticsAlerts (智能根因诊断)
**读取数据**: `data.alarms`

```javascript
// 数据源: 动态生成 (基于MAE数据判断)
// 计算逻辑: p2Service.js 根据饱和度生成
[
  { 
    level: 'high',          // currentRate > 95 ? 'high' : 'medium'
    title: '南看台-干扰过高', 
    desc: '检测到外部干扰源',
    time: '2分钟前'
  }
]
```

**原始JSON文件**: 动态生成（基于 `bff/data/MAE_PERF_15MIN.json` 数据判断）

---

### 中央舞台 (CenterStage.jsx)

#### 7. TopInfoBar (顶部悬浮数据条)
**读取数据**: `data.userTiers` + `data.capacity.saturation`

```javascript
// 数据源: MAE_PERF_15MIN.json 聚合计算
{
  totalUsers: 48500,        // userTiers.reduce((sum, t) => sum + t.value, 0)
  vipUsers: 3200,           // userTiers[0].value + userTiers[1].value
  networkStatus: '优'        // saturation.status 映射
}
```

**原始JSON文件**: `bff/data/MAE_PERF_15MIN.json`

---

#### 8. ZoneProfileModal (区域画像弹窗)
**读取数据**: `data.userTiers` + `data.capacity.saturation`

与 `TopInfoBar` + `CapacityAgent` 相同的数据源

**原始JSON文件**: 
- `bff/data/MAE_PERF_15MIN.json`
- `bff/data/MANUAL_CAPACITY_CONFIG.json`

---

## 三、完整映射表

| 前端组件 | 读取字段 | BFF聚合器 | 原始JSON文件 | 原始字段 |
|---------|---------|----------|-------------|---------|
| **PyramidFunnel** | `data.userTiers[].value` | `buildUserTierFunnel()` | MAE_PERF_15MIN.json | `rrc_conn_users`, `vip_rrc_users` |
| **CapacityAgent** | `data.capacity.saturation` | `calculateSaturation()` | MAE_PERF_15MIN.json + MANUAL_CAPACITY_CONFIG.json | `rrc_conn_users`, `cell_capacity_config` |
| **TerminalAnalysis** | `data.terminals.ranking` | `getDeviceRanking()` | SEQ_DEVICE_HOURLY.json | `top_devices_json` |
| **TerminalAnalysis** | `data.terminals.total5GARatio` | - | DSP_KQI_15MIN.json | `ue_5ga_ratio` |
| **RadarExperience** | `data.experienceRadar.vip/normal` | `getAppKqiExperience()` | DSP_KQI_15MIN.json | `wx_pic_ul_rate_mbps`, `dy_video_freeze_rate`, `game_avg_delay_ms` |
| **AppKQIGrid** | `data.basicKqi.wechat` | - | DSP_KQI_15MIN.json | `wx_msg_success_rate` |
| **AppKQIGrid** | `data.basicKqi.douyin` | - | DSP_KQI_15MIN.json | `dy_video_first_frame_delay_ms`, `dy_video_freeze_rate` |
| **AppKQIGrid** | `data.basicKqi.game` | - | DSP_KQI_15MIN.json | `game_avg_delay_ms` |
| **AppKQIGrid** | `data.basicKqi.payment` | - | DSP_KQI_15MIN.json | `pay_scan_delay_ms` |
| **DiagnosticsAlerts** | `data.alarms` | 动态生成 | MAE_PERF_15MIN.json | `rrc_conn_users` (判断阈值) |
| **TopInfoBar** | 总人数/VIP数 | `buildUserTierFunnel()` | MAE_PERF_15MIN.json | `rrc_conn_users`, `vip_rrc_users` |

---

## 四、API 响应示例

**API 端点**: `GET http://localhost:3000/api/v1/p2/indoor-micro?zone=南看台F区`

**完整响应结构**:
```json
{
  "code": 200,
  "message": "success",
  "timestamp": 1709542800000,
  "zoneName": "南看台F区",
  "data": {
    "userTiers": [...],        // ← MAE_PERF_15MIN.json
    "capacity": {...},         // ← MAE_PERF_15MIN.json + MANUAL_CAPACITY_CONFIG.json
    "terminals": {...},        // ← SEQ_DEVICE_HOURLY.json + DSP_KQI_15MIN.json
    "experienceRadar": {...},  // ← DSP_KQI_15MIN.json
    "basicKqi": {...},         // ← DSP_KQI_15MIN.json
    "alarms": [...],           // ← 动态生成(基于MAE)
    "meta": {...}
  }
}
```

---

## 五、数据血缘追溯

```
PyramidFunnel.userTiers
  └─ p2Service.buildUserTierFunnel()
      └─ MAE_PERF_15MIN.json::rrc_conn_users
      └─ MAE_PERF_15MIN.json::vip_rrc_users

CapacityAgent.saturation
  └─ p2Service.calculateSaturation()
      └─ MAE_PERF_15MIN.json::rrc_conn_users
      └─ MANUAL_CAPACITY_CONFIG.json::cell_capacity_config

TerminalAnalysis.ranking
  └─ p2Service.getDeviceRanking()
      └─ SEQ_DEVICE_HOURLY.json::top_devices_json

RadarExperience.vip/normal
  └─ p2Service.getAppKqiExperience()
      └─ DSP_KQI_15MIN.json::wx_pic_ul_rate_mbps
      └─ DSP_KQI_15MIN.json::dy_video_freeze_rate
      └─ DSP_KQI_15MIN.json::game_avg_delay_ms
      └─ DSP_KQI_15MIN.json::live_hd_ul_peak_rate_mbps

AppKQIGrid.wechat/douyin/game/payment
  └─ p2Service.getAppKqiExperience()
      └─ DSP_KQI_15MIN.json (对应各字段)
```
