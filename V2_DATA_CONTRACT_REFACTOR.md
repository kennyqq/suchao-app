# V2 数据契约重构说明

## 概述

本次重构基于 **数据需求契约表_V2**，全面更新 Frontend 与 BFF 层代码，实现：

1. **字段命名统一化**：`asset_id/asset_type` → `cell_id/cell_type`
2. **坐标解耦**：字符串坐标 → 独立 `lng/lat` Number 字段
3. **时间戳标准化**：字符串日期 → 13位毫秒级 `timestamp` (Long)
4. **新增基准字段**：`baseline_rrc_users` (P1), `top_devices_json` (P2)
5. **前端计算逻辑**：`ratio = rrc_users / baseline_rrc_users`，KQI 环比，5G-A 渗透率
6. **数据字典缓存**：`Map<cell_id, Object>` 用于 O(1) 联表匹配

---

## 文件变更清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/api/services/dashboard.v2.js` | V2 API 服务层，包含数据字典和计算辅助函数 |
| `src/store/useDashboardStore.js` | **覆盖更新** Store V2，添加数据字典缓存和计算逻辑 |
| `src/pages/P1/AmapL7Scene.v2.jsx` | V2 地图组件，接入 Store V2 数据 |
| `src/pages/P1/LeftPanelP1.v2.jsx` | V2 左侧面板，显示计算指标 |
| `src/pages/P1/RightPanelP1.v2.jsx` | V2 右侧面板，显示 KQI 环比 |
| `src/pages/P1/GlobalDefense.v2.jsx` | V2 页面入口 |

### 修改文件

| 文件 | 变更 |
|------|------|
| `src/App.jsx` | 添加 `/p1/v2` 路由 |

---

## V2 数据契约核心字段

### 01_Master_Cell_Dim (小区主数据字典)

```javascript
{
  cell_id: 'cell_001',           // V2: 替换 asset_id
  cell_name: '奥体主站-N1',
  cell_type: 'macro',            // V2: 替换 asset_type
  lng: 118.7265,                 // V2: 独立 Number 字段
  lat: 32.0087,                  // V2: 独立 Number 字段
  azimuth: 0,
  bands: ['n78', 'n79', 'n28'],
}
```

### 03_Master_Cell_Perf_Realtime (小区性能实时数据)

```javascript
{
  cell_id: 'cell_001',
  cell_name: '奥体主站-N1',
  rrc_users: 2847,               // 当前用户数
  baseline_rrc_users: 1500,      // V2 新增: 基准用户数
  prb_util: 72,                  // PRB 利用率
  throughput_mbps: 850,
  timestamp: 1739673600000,      // V2: 13位毫秒级时间戳
}
```

### 06_KQI_Metric_Realtime (KQI 指标实时数据)

```javascript
{
  metric_id: 'kqi_traffic',
  metric_name: '总流量',
  metric_val: 8420,              // 当前值
  baseline_val: 7500,            // V2 新增: 基线值
  unit: 'GB',
  timestamp: 1739673600000,      // V2: 13位毫秒级时间戳
}
```

### 05_Alert_Event_Stream (告警事件流)

```javascript
{
  alert_id: 'alt_001',
  alert_level: 'high',
  alert_type: 'congestion',
  cell_id: 'cell_005',           // V2: 关联小区ID，用于字典查询
  title: '华彩中心拥塞告警',
  description: 'PRB利用率超过85%',
  timestamp: 1739673600000,      // V2: 13位毫秒级时间戳
}
```

---

## 前端计算逻辑

### 1. 压力比率计算

```javascript
// ratio = rrc_users / baseline_rrc_users
export const calculatePressureRatio = (rrcUsers, baseline) => {
  if (!baseline || baseline === 0) return 0;
  return Number((rrcUsers / baseline).toFixed(2));
};
// 示例: 2847 / 1500 = 1.90x
```

### 2. 环比变化率计算

```javascript
// MoM = (current - baseline) / baseline * 100%
export const calculateMoMChange = (current, baseline) => {
  if (!baseline || baseline === 0) return '0%';
  const change = ((current - baseline) / baseline) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
};
// 示例: (8420 - 7500) / 7500 * 100 = +12.3%
```

### 3. 5G-A 渗透率计算

```javascript
// 渗透率 = terminal_5ga / total_users * 100%
export const calculate5GAPenetration = (terminal5GA, totalUsers) => {
  if (!totalUsers || totalUsers === 0) return 0;
  return Number(((terminal5GA / totalUsers) * 100).toFixed(1));
};
// 示例: 3200 / 8500 * 100 = 37.6%
```

---

## 数据字典缓存机制

### 初始化字典

```javascript
// Store V2 中初始化时构建字典
initDictionaries: async () => {
  const [cellDict, userDict] = await Promise.all([
    buildCellDictionaryV2(),  // Map<cell_id, CellDimV2>
    buildUserDictionaryV2(),  // Map<user_id, UserDimV2>
  ]);
  set({ 
    cellDictionary: cellDict, 
    userDictionary: userDict,
    isDictLoaded: true,
  });
}
```

### O(1) 联表查询

```javascript
// 通过 cell_id 查询小区详情
getCellById: (cellId) => get().cellDictionary.get(cellId);

// 通过 cell_id 查询经纬度 (告警联动)
getCellCoordinates: (cellId) => {
  const cell = get().cellDictionary.get(cellId);
  return cell ? { lng: cell.lng, lat: cell.lat } : null;
};
```

---

## 告警联动流程

```
WebSocket 接收告警
    ↓
解析 alert.cell_id
    ↓
Store.getCellCoordinates(cell_id) → O(1) 字典查询
    ↓
获取 {lng, lat}
    ↓
触发地图告警动画
```

---

## 访问方式

- **V1 版本**: `/p1` (原有功能保持不变)
- **V2 版本**: `/p1/v2` (数据契约重构版)

---

## Store V2 API 参考

### State

| 属性 | 类型 | 说明 |
|------|------|------|
| `cellDictionary` | `Map<string, CellDimV2>` | 小区主数据字典 |
| `userDictionary` | `Map<string, UserDimV2>` | 用户主数据字典 |
| `cellPerfRealtime` | `CellPerfV2[]` | 小区性能实时数据 |
| `kqiRealtime` | `KQIMetricV2[]` | KQI 指标实时数据 |
| `alertEventStream` | `AlertEventV2[]` | 告警事件流 |

### Actions

| 方法 | 说明 |
|------|------|
| `initDictionaries()` | 初始化数据字典 |
| `fetchV2RealtimeData()` | 获取实时数据 |
| `getCellById(cellId)` | O(1) 查询小区 |
| `getCellCoordinates(cellId)` | O(1) 查询坐标 |
| `getComputedCellPerf()` | 获取带计算指标的 Cell 数据 |
| `getComputedKQI()` | 获取带环比的 KQI 数据 |
| `handleWebSocketAlert(alert)` | 处理告警联动 |

---

## 兼容性说明

- V1 和 V2 版本共存，通过不同路由访问
- 原有 API 服务 `dashboard.js` 保留，V2 使用 `dashboard.v2.js`
- Store V2 包含 V1 的所有状态，向后兼容
