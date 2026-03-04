/**
 * P2 场内微观视图 - API 请求模块
 * 对接 BFF 中台服务
 */

// BFF 服务基础地址
const BFF_BASE_URL = import.meta.env.VITE_BFF_URL || 'http://localhost:3000/api/v1';

/**
 * 兜底备用数据 - 当API请求失败时使用
 * 结构与BFF返回格式完全一致，匹配组件期望
 */
const FALLBACK_DATA = {
  // 分层分级用户 - 金字塔漏斗数据
  userTiers: [
    { label: '场馆包用户', value: 3200, color: '#FFD700', width: '35%', description: 'VIP专属场馆包' },
    { label: '钻/白金卡', value: 8500, color: '#C0C0C0', width: '55%', description: '全球通高端用户' },
    { label: '普通用户', value: 36800, color: '#00F0FF', width: '85%', description: '大众用户群体' }
  ],
  // 容量评估数据
  capacity: {
    saturation: {
      currentRate: 80.8,
      capacity: 60000,
      currentUsers: 48500,
      status: 'normal', // normal, caution, warning, critical
      warningLevel: 1,
      remaining: 11500,
      saturationLevel: 'medium' // low, medium, high
    },
    prbUtilization: 70.4,
    trafficToday: 5680.2
  },
  // 终端分析数据
  terminals: {
    total5GARatio: 68.5,
    ranking: [
      { rank: 1, brand: '华为', model: 'Mate60 Pro', count: 8500, share: '25.2', capability: '5G-A' },
      { rank: 2, brand: 'Apple', model: 'iPhone 15 Pro Max', count: 7200, share: '21.3', capability: '5G-A' },
      { rank: 3, brand: '小米', model: '小米14', count: 6800, share: '20.1', capability: '5G' },
      { rank: 4, brand: '华为', model: 'P60', count: 5400, share: '16.0', capability: '5G' },
      { rank: 5, brand: 'Apple', model: 'iPhone 14', count: 4900, share: '14.5', capability: '5G' }
    ],
    brandDistribution: [
      { name: '华为', value: 13900, share: '41.2' },
      { name: 'Apple', value: 12100, share: '35.8' },
      { name: '小米', value: 6800, share: '20.1' },
      { name: '其他', value: 1050, share: '3.1' }
    ]
  },
  // 体验雷达图数据 - 与ECharts radar组件匹配
  experienceRadar: {
    // VIP用户数据: [下行速率, 语音清晰, 视频卡顿, 直播上行, 低时延]
    vip: [850, 95, 98, 100, 95],
    // 普通用户数据
    normal: [400, 80, 75, 85, 70],
    // 指标配置
    indicators: [
      { name: '下行速率', max: 1000 },
      { name: '语音清晰', max: 100 },
      { name: '视频卡顿', max: 100 },
      { name: '直播上行', max: 100 },
      { name: '低时延', max: 100 }
    ]
  },
  // 基础业务KQI数据 - 与AppKqiGrid组件匹配
  basicKqi: {
    wechat: {
      delay: 20, // 数字类型，组件会加上ms单位
      successRate: 99.2,
      ulRate: 12.5
    },
    douyin: {
      definition: '高清', // 画质等级
      bitrate: 15000, // 码率 kbps
      firstFrame: 180
    },
    game: {
      latency: 38 // 数字类型，组件会加上ms单位
    },
    payment: {
      success: 99.9 // 数字类型，组件会加上%单位
    }
  },
  // 告警数据
  alarms: [
    { 
      level: 'high', 
      title: '南看台-干扰过高', 
      desc: '检测到外部干扰源，建议排查',
      time: '2分钟前'
    },
    { 
      level: 'medium', 
      title: '西入口-弱覆盖', 
      desc: '信号强度低于阈值-95dBm',
      time: '5分钟前'
    }
  ],
  // 元数据
  meta: {
    zoneName: '南看台F区',
    timestamp: Date.now(),
    dataSource: 'fallback'
  }
};

/**
 * 获取 P2 场内微观视图数据
 * @param {string} zoneName - 防线区名称，默认'南看台F区'
 * @returns {Promise<Object>} 聚合数据对象
 */
export async function fetchP2IndoorMicroData(zoneName = '南看台F区') {
  try {
    const url = `${BFF_BASE_URL}/p2/indoor-micro?zone=${encodeURIComponent(zoneName)}`;
    
    console.log('[P2 API] 请求数据:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      // 10秒超时
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.code !== 200) {
      throw new Error(`BFF返回错误: ${result.message}`);
    }

    console.log('[P2 API] 数据获取成功:', result.data?.meta?.zoneName || zoneName);
    
    // 直接返回 BFF 数据，简化逻辑避免错误
    if (result.data && result.data.userTiers) {
      console.log('[P2 API] 使用BFF数据');
      return {
        ...FALLBACK_DATA,
        ...result.data,
        meta: {
          ...FALLBACK_DATA.meta,
          ...result.data.meta,
          dataSource: 'bff'
        }
      };
    }
    
    console.warn('[P2 API] BFF数据格式异常，使用兜底数据');
    return FALLBACK_DATA;

  } catch (error) {
    console.error('[P2 API] 请求失败，使用兜底数据:', error.message);
    
    // 返回兜底数据，确保UI不崩溃
    return FALLBACK_DATA;
  }
}

/**
 * 获取所有可用防线区列表
 * @returns {Promise<Array>} 区域列表
 */
export async function fetchP2Zones() {
  try {
    const url = `${BFF_BASE_URL}/p2/zones`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('获取区域列表失败');
    }
    
    const result = await response.json();
    return result.data || [];
    
  } catch (error) {
    console.error('[P2 API] 获取区域列表失败:', error.message);
    // 返回默认区域列表
    return [
      { name: '南看台F区', displayName: '南看台F区', type: 'standard' },
      { name: '北看台B区', displayName: '北看台B区', type: 'standard' },
      { name: '东看台A区', displayName: '东看台A区', type: 'standard' },
      { name: '西看台VIP', displayName: '西看台VIP', type: 'vip' }
    ];
  }
}

// 导出兜底数据供外部使用
export { FALLBACK_DATA };
