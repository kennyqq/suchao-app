/**
 * P2 场内微观视图 - BFF聚合服务
 * 
 * 职责：将底层多个物理表的数据聚合成前端组件需要的嵌套JSON结构
 * 数据源：
 * - MAE_PERF_15MIN: 网管性能指标 (rrc_conn_users, prb_util, traffic)
 * - SEQ_DEVICE_HOURLY: 信令终端数据 (top_devices_json)
 * - DSP_KQI_15MIN: 智能板KQI指标 (业务体验指标)
 * - MANUAL_CAPACITY_CONFIG: 人工容量配置
 */

const path = require('path');
const fs = require('fs');

// 模拟底层物理表数据存储
const DATA_DIR = path.join(__dirname, '../data');

/**
 * 加载本地模拟的底层物理表数据
 * 实际生产环境：通过JDBC/ODBC/API连接真实数据源
 * 
 * 注意：使用 fs.readFileSync 实时读取，避免 Node.js require 缓存
 * 每次 API 请求都会重新读取硬盘上的最新文件内容
 */
function loadPhysicalTable(tableName) {
  try {
    const filePath = path.join(DATA_DIR, `${tableName}.json`);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error(`[P2Service] 物理表文件不存在: ${filePath}`);
      return { records: [] };
    }
    
    // 实时读取文件内容（避免 require 缓存）
    const rawData = fs.readFileSync(filePath, 'utf-8');
    
    // 解析 JSON
    const parsedData = JSON.parse(rawData);
    
    // 记录加载成功日志（仅在 DEBUG 模式下详细输出）
    const recordCount = parsedData.records ? parsedData.records.length : 0;
    console.log(`[P2Service] ✓ 实时加载: ${tableName}.json (${recordCount} 条记录)`);
    
    return parsedData;
    
  } catch (error) {
    // JSON 格式错误时的详细提示
    if (error instanceof SyntaxError) {
      console.error(`[P2Service] ✗ JSON 格式错误: ${tableName}.json`);
      console.error(`[P2Service]   错误详情: ${error.message}`);
      console.error(`[P2Service]   请检查文件: bff/data/${tableName}.json`);
      console.error(`[P2Service]   常见问题: 缺少逗号、引号不匹配、多余逗号等`);
    } else {
      console.error(`[P2Service] ✗ 加载物理表失败: ${tableName}`, error.message);
    }
    
    // 返回空数据结构，避免服务崩溃
    return { records: [] };
  }
}

/**
 * 按zone_name聚合网管性能数据
 * @param {string} zoneName - 防线区名称，如'南看台F区'
 */
function aggregateMaePerformance(zoneName) {
  const maeData = loadPhysicalTable('MAE_PERF_15MIN');
  const records = maeData.records.filter(r => r.zone_name === zoneName);
  
  if (records.length === 0) {
    return null;
  }
  
  // 简单聚合（实际可能需要更复杂的加权平均）
  return {
    totalUsers: records.reduce((sum, r) => sum + r.rrc_conn_users, 0),
    vipUsers: records.reduce((sum, r) => sum + r.vip_rrc_users, 0),
    avgPrbUtil: (records.reduce((sum, r) => sum + r.prb_util_dl, 0) / records.length).toFixed(1),
    trafficDl: records.reduce((sum, r) => sum + r.traffic_total_dl_mb, 0).toFixed(1)
  };
}

/**
 * 获取终端排行数据
 * @param {string} zoneName - 防线区名称
 */
function getDeviceRanking(zoneName) {
  const seqData = loadPhysicalTable('SEQ_DEVICE_HOURLY');
  const record = seqData.records.find(r => r.zone_name === zoneName);
  
  if (!record || !record.top_devices_json) {
    return [];
  }
  
  // 转换为前端需要的格式
  return record.top_devices_json.map((device, index) => ({
    rank: index + 1,
    brand: device.model.split(' ')[0], // 提取品牌
    model: device.model,
    count: device.count,
    share: ((device.count / record.top_devices_json.reduce((s, d) => s + d.count, 0)) * 100).toFixed(1),
    capability: device.capability
  }));
}

/**
 * 获取业务KQI体验数据
 * @param {string} zoneName - 防线区名称
 */
function getAppKqiExperience(zoneName) {
  const dspData = loadPhysicalTable('DSP_KQI_15MIN');
  const record = dspData.records.find(r => r.zone_name === zoneName);
  
  if (!record) {
    return null;
  }
  
  return {
    // 基础业务体验（雷达图数据）
    radar: {
      dlSpeed: Math.min(1000, Math.round(record.wx_pic_ul_rate_mbps * 20)), // 换算为Mbps并缩放
      voiceQuality: 98,
      videoFreeze: Math.round(100 - record.dy_video_freeze_rate * 10), // 转换为质量分
      liveUl: Math.round(record.live_hd_ul_peak_rate_mbps * 1.2),
      lowLatency: Math.round(100 - record.game_avg_delay_ms)
    },
    // 详细KQI指标
    details: {
      wechat: {
        latency: record.wx_msg_success_rate > 99 ? '20ms' : '45ms',
        successRate: record.wx_msg_success_rate + '%',
        ulRate: record.wx_pic_ul_rate_mbps + 'Mbps'
      },
      douyin: {
        firstFrame: record.dy_video_first_frame_delay_ms + 'ms',
        freezeRate: record.dy_video_freeze_rate + '%'
      },
      game: {
        avgDelay: record.game_avg_delay_ms + 'ms'
      },
      payment: {
        scanDelay: record.pay_scan_delay_ms + 'ms'
      }
    }
  };
}

/**
 * 获取容量配置数据
 * @param {string} zoneName - 防线区名称
 */
function getCapacityConfig(zoneName) {
  const capacityData = loadPhysicalTable('MANUAL_CAPACITY_CONFIG');
  const record = capacityData.records.find(r => r.zone_name === zoneName);
  
  return record ? record.cell_capacity_config : 60000; // 默认容量
}

/**
 * 组装用户分层漏斗数据
 * @param {Object} maePerf - 网管性能聚合数据
 */
function buildUserTierFunnel(maePerf) {
  if (!maePerf) {
    return [];
  }
  
  const totalUsers = maePerf.totalUsers;
  const vipUsers = maePerf.vipUsers;
  const normalUsers = totalUsers - vipUsers;
  
  // 场馆包用户估算（VIP中的一部分）
  const packageUsers = Math.round(vipUsers * 0.15);
  const globalGoldUsers = Math.round(vipUsers * 0.35);
  const diamondUsers = vipUsers - packageUsers - globalGoldUsers;
  
  return [
    { 
      label: '场馆包用户', 
      value: packageUsers, 
      color: '#FFD700', 
      width: '35%',
      description: 'VIP专属场馆包'
    },
    { 
      label: '钻/白金卡', 
      value: diamondUsers + globalGoldUsers, 
      color: '#C0C0C0', 
      width: '55%',
      description: '全球通高端用户'
    },
    { 
      label: '普通用户', 
      value: normalUsers, 
      color: '#00F0FF', 
      width: '85%',
      description: '大众用户群体'
    }
  ];
}

/**
 * 计算放号饱和度
 * @param {number} currentUsers - 当前用户数
 * @param {number} capacity - 容量配置
 */
function calculateSaturation(currentUsers, capacity) {
  const rate = (currentUsers / capacity * 100).toFixed(1);
  let status = 'normal';
  let warningLevel = 0;
  
  if (rate >= 95) {
    status = 'critical';
    warningLevel = 3;
  } else if (rate >= 85) {
    status = 'warning';
    warningLevel = 2;
  } else if (rate >= 70) {
    status = 'caution';
    warningLevel = 1;
  }
  
  // 饱和度等级
  const saturationLevel = rate >= 85 ? 'high' : rate >= 60 ? 'medium' : 'low';
  
  return {
    currentRate: parseFloat(rate),
    capacity: capacity,
    currentUsers: currentUsers,
    status: status,
    warningLevel: warningLevel,
    remaining: capacity - currentUsers,
    saturationLevel: saturationLevel
  };
}

// ==================== 主聚合接口 ====================

/**
 * 获取P2场内微观视图的完整聚合数据
 * @param {string} zoneName - 防线区名称，默认为'南看台F区'
 */
function getIndoorMicroData(zoneName = '南看台F区') {
  console.log(`[P2Service] 聚合数据: zone=${zoneName}`);
  
  try {
    // 1. 读取底层物理表
    const maePerf = aggregateMaePerformance(zoneName);
    const devices = getDeviceRanking(zoneName);
    const kqi = getAppKqiExperience(zoneName);
    const capacity = getCapacityConfig(zoneName);
    
    if (!maePerf) {
      return {
        code: 404,
        message: `未找到区域数据: ${zoneName}`,
        data: null
      };
    }
    
    // 2. 聚合组装成前端需要的嵌套JSON
    const result = {
      code: 200,
      message: 'success',
      timestamp: Date.now(),
      zoneName: zoneName,
      data: {
        // 模块一：分层分级用户（金字塔漏斗图）
        userTiers: buildUserTierFunnel(maePerf),
        
        // 模块二：放号评估智能体
        capacity: {
          saturation: calculateSaturation(maePerf.totalUsers, capacity),
          prbUtilization: parseFloat(maePerf.avgPrbUtil),
          trafficToday: parseFloat(maePerf.trafficDl)
        },
        
        // 模块三：终端分布（热门终端排行）
        terminals: {
          total5GARatio: kqi ? 68.5 : 0, // 从DSP获取
          ranking: devices.slice(0, 5),
          brandDistribution: calculateBrandDistribution(devices)
        },
        
        // 模块四：分层分级体验（雷达图）- 匹配前端ECharts radar组件
        experienceRadar: kqi ? {
          // VIP用户数据: [下行速率, 语音清晰, 视频卡顿, 直播上行, 低时延]
          vip: [
            Math.min(1000, Math.round(kqi.radar.dlSpeed * 1.2)),
            kqi.radar.voiceQuality,
            kqi.radar.videoFreeze,
            100, // VIP直播上行体验最优
            Math.min(100, Math.round(kqi.radar.lowLatency * 1.1))
          ],
          // 普通用户数据（VIP的70-80%水平）
          normal: [
            Math.round(kqi.radar.dlSpeed * 0.6),
            Math.round(kqi.radar.voiceQuality * 0.85),
            Math.round(kqi.radar.videoFreeze * 0.8),
            Math.round(kqi.radar.liveUl * 0.75),
            Math.round(kqi.radar.lowLatency * 0.75)
          ],
          // 雷达图指标配置
          indicators: [
            { name: '下行速率', max: 1000 },
            { name: '语音清晰', max: 100 },
            { name: '视频卡顿', max: 100 },
            { name: '直播上行', max: 100 },
            { name: '低时延', max: 100 }
          ]
        } : null,
        
        // 模块五：基础业务保障（App KQI Grid）- 匹配前端组件
        basicKqi: kqi ? {
          wechat: {
            delay: parseInt(kqi.details.wechat.latency) || 20, // 数字类型
            successRate: parseFloat(kqi.details.wechat.successRate) || 99.2,
            ulRate: parseFloat(kqi.details.wechat.ulRate) || 12.5
          },
          douyin: {
            definition: parseFloat(kqi.details.douyin.freezeRate) < 3 ? '高清' : '标清',
            bitrate: 15000, // kbps
            firstFrame: parseInt(kqi.details.douyin.firstFrame) || 180
          },
          game: {
            latency: parseInt(kqi.details.game.avgDelay) || 38 // 数字类型，单位ms
          },
          payment: {
            success: parseFloat(kqi.details.payment.scanDelay) < 500 ? 99.9 : 98.5 // 数字类型，%
          }
        } : null,
        
        // 告警数据（模拟）
        alarms: [
          { 
            level: maePerf.totalUsers > 50000 ? 'high' : 'medium', 
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
          zoneName: zoneName,
          timestamp: Date.now(),
          dataSource: 'bff'
        },
        
        // 原始底层数据源引用（用于数据血缘追溯）
        _dataSources: {
          mae: 'MAE_PERF_15MIN',
          seq: 'SEQ_DEVICE_HOURLY',
          dsp: 'DSP_KQI_15MIN',
          manual: 'MANUAL_CAPACITY_CONFIG'
        }
      }
    };
    
    return result;
    
  } catch (error) {
    console.error('[P2Service] 聚合失败:', error);
    return {
      code: 500,
      message: 'BFF聚合服务内部错误',
      error: error.message
    };
  }
}

/**
 * 计算品牌分布
 * @param {Array} devices - 终端列表
 */
function calculateBrandDistribution(devices) {
  const brandMap = {};
  const total = devices.reduce((sum, d) => sum + d.count, 0);
  
  devices.forEach(device => {
    const brand = device.brand;
    if (!brandMap[brand]) {
      brandMap[brand] = { count: 0, share: 0 };
    }
    brandMap[brand].count += device.count;
  });
  
  return Object.entries(brandMap).map(([name, data]) => ({
    name,
    value: data.count,
    share: ((data.count / total) * 100).toFixed(1)
  }));
}

/**
 * 获取所有可用区域列表
 */
function getAvailableZones() {
  const maeData = loadPhysicalTable('MAE_PERF_15MIN');
  const zones = [...new Set(maeData.records.map(r => r.zone_name))];
  
  return {
    code: 200,
    data: zones.map(name => ({
      name,
      displayName: name,
      type: name.includes('VIP') ? 'vip' : 'standard'
    }))
  };
}

module.exports = {
  getIndoorMicroData,
  getAvailableZones,
  // 导出内部方法供测试
  _loadPhysicalTable: loadPhysicalTable,
  _aggregateMaePerformance: aggregateMaePerformance
};
