# 苏超智能化指挥中心 - BFF 前端联调改造指南

> **文档版本**: v1.0  
> **适用范围**: 前端开发工程师（Vue 3 + React）  
> **目标**: 将静态 Mock 数据迁移至真实 BFF API

---

## 📡 BFF 服务信息

| 项目 | 值 |
|------|-----|
| **服务地址** | `http://localhost:3000` |
| **API前缀** | `/api/v1` |
| **P2场内微观接口** | `GET /api/v1/p2/indoor-micro` |
| **健康检查** | `GET /health` |

---

## 🚀 快速启动 BFF 服务

```bash
# 1. 进入 bff 目录
cd bff

# 2. 安装依赖
npm install

# 3. 启动开发模式（热更新）
npm run dev

# 4. 或启动生产模式
npm start
```

启动成功后，控制台应显示：
```
============================================================
🚀 苏超 BFF 中台服务已启动运行
============================================================
📡 服务地址: http://localhost:3000
📋 API前缀:  /api/v1
🔍 健康检查: http://localhost:3000/health
📊 P2场内微观: http://localhost:3000/api/v1/p2/indoor-micro
============================================================
```

---

## 🔧 前端代码改造示例

### 改造前：静态 Mock 数据

```javascript
// VenueMicro.jsx (改造前)
import { ref, onMounted } from 'vue';

// ❌ 静态 Mock 数据
const mockData = {
  userTiers: [
    { label: '场馆包用户', value: 200, color: '#FFD700' },
    { label: '全球通金卡', value: 1500, color: '#C0C0C0' },
    { label: '普通用户', value: 48000, color: '#00F0FF' }
  ],
  // ... 其他静态数据
};

export default function VenueMicro() {
  const data = ref(mockData); // 直接使用静态数据
  
  onMounted(() => {
    // 无数据加载逻辑
  });
}
```

---

### 改造后：对接真实 BFF API

#### 方案 A：使用原生 Fetch (推荐用于快速验证)

```javascript
// VenueMicro.jsx (改造后 - Fetch版)
import { ref, onMounted } from 'vue';

const BFF_BASE_URL = 'http://localhost:3000/api/v1';

export default function VenueMicro() {
  // ✅ 响应式数据
  const p2Data = ref(null);
  const loading = ref(false);
  const error = ref(null);
  
  // 当前选中的防线区
  const currentZone = ref('南看台F区');
  
  /**
   * 从BFF中台获取P2场内微观数据
   */
  const fetchP2Data = async (zoneName = '南看台F区') => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch(
        `${BFF_BASE_URL}/p2/indoor-micro?zone=${encodeURIComponent(zoneName)}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.code !== 200) {
        throw new Error(result.message || 'BFF返回错误');
      }
      
      // ✅ 赋值给响应式变量
      p2Data.value = result.data;
      console.log('[VenueMicro] BFF数据加载成功:', result);
      
    } catch (err) {
      console.error('[VenueMicro] 数据加载失败:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };
  
  // 组件挂载时拉取数据
  onMounted(() => {
    fetchP2Data(currentZone.value);
  });
  
  // 切换防线区时重新拉取
  const handleZoneChange = (zone) => {
    currentZone.value = zone;
    fetchP2Data(zone);
  };
  
  return {
    p2Data,
    loading,
    error,
    currentZone,
    handleZoneChange
  };
}
```

---

#### 方案 B：使用 Axios (推荐用于生产环境)

```javascript
// VenueMicro.jsx (改造后 - Axios版)
import { ref, onMounted } from 'vue';
import axios from 'axios';

// 创建BFF中台API实例
const bffApi = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加日志
bffApi.interceptors.request.use(
  (config) => {
    console.log(`[BFF Request] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 统一错误处理
bffApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('[BFF Error]', error.message);
    return Promise.reject(error);
  }
);

export default function VenueMicro() {
  const p2Data = ref(null);
  const loading = ref(false);
  const error = ref(null);
  
  /**
   * 使用Axios获取P2数据
   */
  const fetchP2Data = async (zoneName = '南看台F区') => {
    loading.value = true;
    error.value = null;
    
    try {
      // ✅ Axios自动解析JSON
      const result = await bffApi.get('/p2/indoor-micro', {
        params: { zone: zoneName }
      });
      
      if (result.code === 200) {
        p2Data.value = result.data;
      } else {
        throw new Error(result.message);
      }
      
    } catch (err) {
      error.value = err.message;
      // 可选：降级到本地Mock数据
      // p2Data.value = fallbackMockData;
    } finally {
      loading.value = false;
    }
  };
  
  onMounted(() => {
    fetchP2Data();
  });
  
  return { p2Data, loading, error, fetchP2Data };
}
```

---

#### 方案 C：封装 Composable (推荐用于大型项目)

```javascript
// composables/useP2Data.js
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

const BFF_BASE_URL = import.meta.env.VITE_BFF_URL || 'http://localhost:3000/api/v1';

/**
 * P2场内微观数据 Composable
 * 封装BFF数据获取、轮询、错误处理等逻辑
 */
export function useP2Data(options = {}) {
  const {
    zoneName = '南看台F区',
    pollInterval = 60000, // 默认60秒轮询
    enablePolling = true
  } = options;
  
  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);
  let pollTimer = null;
  
  const fetchData = async () => {
    loading.value = true;
    
    try {
      const response = await axios.get(
        `${BFF_BASE_URL}/p2/indoor-micro`,
        { params: { zone: zoneName } }
      );
      
      if (response.data.code === 200) {
        data.value = response.data.data;
        error.value = null;
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };
  
  // 启动轮询
  const startPolling = () => {
    if (enablePolling && !pollTimer) {
      pollTimer = setInterval(fetchData, pollInterval);
    }
  };
  
  // 停止轮询
  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };
  
  // 刷新数据
  const refresh = () => fetchData();
  
  onMounted(() => {
    fetchData();
    startPolling();
  });
  
  onUnmounted(() => {
    stopPolling();
  });
  
  return {
    data,
    loading,
    error,
    refresh,
    startPolling,
    stopPolling
  };
}
```

使用方式：

```javascript
// VenueMicro.jsx
import { useP2Data } from './composables/useP2Data';

export default function VenueMicro() {
  // ✅ 一行代码搞定数据获取
  const { 
    data: p2Data, 
    loading, 
    error, 
    refresh 
  } = useP2Data({
    zoneName: '南看台F区',
    pollInterval: 60000 // 60秒自动刷新
  });
  
  return { p2Data, loading, error, refresh };
}
```

---

## 📊 组件数据映射对照

| 前端组件 | 原Mock字段 | BFF返回字段路径 |
|---------|-----------|----------------|
| **金字塔漏斗图** | `pyramidData` | `data.userTiers` |
| **放号智能体** | `currentValue` | `data.capacity.saturation.currentRate` |
| **终端排行** | `terminalRanking` | `data.terminals.ranking` |
| **体验雷达** | `radarData` | `data.experienceRadar` |
| **App KQI** | `appData` | `data.basicKqi` |

---

## 🔍 调试技巧

### 1. 浏览器直接测试API

```bash
# 健康检查
curl http://localhost:3000/health

# 获取南看台数据
curl "http://localhost:3000/api/v1/p2/indoor-micro?zone=南看台F区"

# 获取VIP区数据
curl "http://localhost:3000/api/v1/p2/indoor-micro?zone=西看台VIP"
```

### 2. Chrome DevTools 网络面板

打开 Network 面板，过滤 `localhost:3000`，观察：
- 请求URL是否正确
- 响应状态码
- 响应数据结构

### 3. Vue DevTools 状态检查

在 Vue DevTools 中检查：
- `p2Data` 响应式变量是否有值
- `loading` 状态变化
- `error` 是否捕获异常

---

## ⚠️ 常见问题

### Q1: 跨域错误 (CORS)

**现象**: `Access-Control-Allow-Origin` 错误

**解决**: BFF server.js 已配置 CORS，确保前端访问地址在允许列表中：

```javascript
// bff/server.js
cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'] // 添加你的前端地址
})
```

### Q2: 数据为空

**现象**: API返回200但 `data` 为 null

**排查**:
1. 检查 `zone` 参数是否匹配（如"南看台F区"）
2. 查看BFF控制台是否有加载物理表错误
3. 确认 `bff/data/` 目录下JSON文件存在

### Q3: TypeError: Cannot read property 'xxx' of null

**现象**: 解构赋值时报错

**解决**: 添加空值保护

```javascript
// ❌ 错误
const users = p2Data.value.userTiers;

// ✅ 正确
const users = p2Data.value?.userTiers || [];
```

---

## 📚 附录：完整数据结构示例

```json
{
  "code": 200,
  "message": "success",
  "timestamp": 1709542800000,
  "zoneName": "南看台F区",
  "data": {
    "userTiers": [
      { "label": "场馆包用户", "value": 3200, "color": "#FFD700", "width": "35%" },
      { "label": "钻/白金卡", "value": 8500, "color": "#C0C0C0", "width": "55%" },
      { "label": "普通用户", "value": 36800, "color": "#00F0FF", "width": "85%" }
    ],
    "capacity": {
      "saturation": {
        "currentRate": 80.8,
        "capacity": 60000,
        "currentUsers": 48500,
        "status": "normal"
      }
    },
    "terminals": {
      "total5GARatio": 68.5,
      "ranking": [
        { "rank": 1, "brand": "华为", "model": "华为Mate60 Pro", "count": 8500 }
      ]
    },
    "experienceRadar": {
      "dlSpeed": 850,
      "voiceQuality": 98,
      "videoFreeze": 97,
      "liveUl": 100,
      "lowLatency": 95
    }
  }
}
```

---

**文档维护**: 苏超技术团队  
**最后更新**: 2024-03-04
