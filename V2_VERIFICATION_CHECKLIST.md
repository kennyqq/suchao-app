# V2 数据契约重构验证清单

## 启动验证

```bash
npm run dev
```

访问 http://localhost:5173/p1/v2

---

## 功能验证项

### 1. 数据字典加载 ✅

- [ ] 控制台输出 `[Store V2] 数据字典加载完成`
- [ ] `cellDictionary` Map 包含 8 个小区数据
- [ ] `isDictLoaded` 状态为 true

**验证代码**:
```javascript
// 浏览器控制台
const store = useDashboardStore.getState();
console.log('Cell Dictionary:', store.cellDictionary);
console.log('Dict Loaded:', store.isDictLoaded);
```

---

### 2. 实时数据获取 ✅

- [ ] `fetchV2RealtimeData()` 成功执行
- [ ] `cellPerfRealtime` 包含 4 条记录
- [ ] `kqiRealtime` 包含 4 条记录
- [ ] `alertEventStream` 包含 3 条告警

**验证字段**:
```javascript
// 检查 V2 字段
const store = useDashboardStore.getState();
console.log('Cell Perf:', store.cellPerfRealtime);
// 应包含: cell_id, cell_name, rrc_users, baseline_rrc_users, prb_util, timestamp

console.log('KQI:', store.kqiRealtime);
// 应包含: metric_id, metric_name, metric_val, baseline_val, unit, timestamp
```

---

### 3. 前端计算指标 ✅

- [ ] `getComputedCellPerf()` 返回带 `pressure_ratio` 的数据
- [ ] `getComputedKQI()` 返回带 `mom_change` 的数据
- [ ] 比率计算正确: `ratio = rrc_users / baseline_rrc_users`

**验证示例**:
```javascript
const store = useDashboardStore.getState();
const cellPerf = store.getComputedCellPerf();
console.log('压力比率:', cellPerf[0].pressure_ratio);
// 预期: 2847 / 1500 ≈ 1.90

const kqi = store.getComputedKQI();
console.log('环比变化:', kqi[0].mom_change);
// 预期: (8420 - 7500) / 7500 ≈ +12.3%
```

---

### 4. 坐标字段验证 ✅

- [ ] `lng` 为独立 Number 字段 (非字符串)
- [ ] `lat` 为独立 Number 字段 (非字符串)
- [ ] 坐标值在奥体中心范围 [118.7265±0.005, 32.0087±0.005]

**验证**:
```javascript
const store = useDashboardStore.getState();
const cell = store.getCellById('cell_001');
console.log(typeof cell.lng); // "number"
console.log(typeof cell.lat); // "number"
console.log(cell.lng, cell.lat); // 118.7265, 32.0087
```

---

### 5. 时间戳验证 ✅

- [ ] `timestamp` 为 13 位毫秒级 Long
- [ ] 时间戳格式正确

**验证**:
```javascript
const store = useDashboardStore.getState();
const perf = store.cellPerfRealtime[0];
console.log(perf.timestamp); // 如: 1739673600000 (13位)
console.log(new Date(perf.timestamp).toISOString()); // 可读日期
```

---

### 6. 告警联动 (cell_id → 地图动画) ✅

- [ ] 告警列表显示 `cell_id` 标签
- [ ] 点击告警触发地图动画
- [ ] 控制台输出 `[AmapL7Scene V2] 触发告警动画`

**测试步骤**:
1. 访问 `/p1/v2`
2. 等待数据加载
3. 查看右侧面板告警列表
4. 确认告警卡片显示 `cell_id` (如 `cell_005`)
5. 观察地图是否显示告警动画

---

### 7. PRB 负载监控 ✅

- [ ] 左侧面板显示 PRB 利用率
- [ ] 显示 `ratio` 值 (压力比率)
- [ ] 进度条颜色根据阈值变化

**验证数据**:
| 场景 | PRB | Ratio |
|------|-----|-------|
| 元通地铁入口 | 78% | ~2.37x |
| 南看台 F区 | 62% | ~1.73x |
| 奥体北门检票口 | 45% | ~1.42x |
| 内场VIP区 | 38% | ~1.28x |

---

### 8. KQI 环比显示 ✅

- [ ] 右侧面板显示环比变化
- [ ] 上升趋势绿色，下降趋势红色
- [ ] 时延指标反向判断 (越低越好)

**验证数据**:
| 指标 | 当前值 | 基线值 | 环比 |
|------|--------|--------|------|
| 总流量 | 8420 GB | 7500 GB | +12.3% |
| 语音话务量 | 420 Erl | 400 Erl | +5.0% |
| 平均吞吐 | 520 Mbps | 530 Mbps | -1.9% |
| 时延 | 12 ms | 13 ms | -7.7% |

---

### 9. 地图渲染 ✅

- [ ] 热力图正常显示 (2D 贴地模式)
- [ ] 基站图标正常显示 (sector-site)
- [ ] 点击基站弹出详情面板
- [ ] 详情面板显示 V2 字段 (ratio, mom, lng, lat)

---

### 10. 兼容性 ✅

- [ ] `/p1` 原有功能正常
- [ ] `/p1/v2` 新功能正常
- [ ] 两个版本互不干扰

---

## 常见问题排查

### Q: 地图白屏
**排查**: 检查 `VITE_AMAP_KEY` 环境变量是否配置

### Q: Store 数据为空
**排查**: 
```javascript
// 检查字典是否加载
useDashboardStore.getState().initDictionaries();

// 检查数据是否获取
useDashboardStore.getState().fetchV2RealtimeData();
```

### Q: 告警联动不触发
**排查**: 检查 `cell_id` 是否在字典中存在
```javascript
const store = useDashboardStore.getState();
console.log(store.getCellCoordinates('cell_001'));
// 应返回 {lng: 118.7265, lat: 32.0087}
```

---

## 重构完成标记

- [x] 字段命名: asset_id → cell_id
- [x] 坐标解耦: 字符串 → lng/lat Number
- [x] 时间戳: ISO字符串 → 13位毫秒级 Long
- [x] 基准字段: baseline_rrc_users
- [x] 前端计算: ratio = rrc_users / baseline_rrc_users
- [x] 数据字典: Map<cell_id, Object>
- [x] 告警联动: cell_id → 字典查询 → 地图动画
- [x] V1/V2 版本共存
