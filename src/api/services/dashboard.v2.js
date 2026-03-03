/**
 * 大屏数据服务 V2 - 基于数据需求契约表_V2
 * 提供 P0/P1/P2/P3 视图的标准化数据接口
 */

import { http } from '../request.js';

// ============================================
// V2 数据契约 - 主数据字典
// ============================================

/**
 * 01_Master_Cell_Dim - 基站主数据字典
 * @returns {Promise<CellDimV2[]>}
 */
export const fetchMasterCellDimV2 = () => {
  return Promise.resolve([
    { cell_id: 'cell_001', cell_name: '奥体主站-N1', cell_type: 'macro', lng: 118.7265, lat: 32.0087, azimuth: 0, bands: ['n78', 'n79', 'n28'] },
    { cell_id: 'cell_002', cell_name: '奥体主站-S1', cell_type: 'macro', lng: 118.7265, lat: 32.0067, azimuth: 180, bands: ['n78', 'n79', 'n28'] },
    { cell_id: 'cell_003', cell_name: '奥体东站-E1', cell_type: 'macro', lng: 118.7320, lat: 32.0095, azimuth: 90, bands: ['n78', 'n28'] },
    { cell_id: 'cell_004', cell_name: '奥体西站-W1', cell_type: 'macro', lng: 118.7210, lat: 32.0090, azimuth: 270, bands: ['n78', 'n28'] },
    { cell_id: 'cell_005', cell_name: '华彩中心-H1', cell_type: 'macro', lng: 118.7400, lat: 32.0120, azimuth: 45, bands: ['n78', 'n79', 'n28'] },
    { cell_id: 'cell_006', cell_name: '元通枢纽-Y1', cell_type: 'macro', lng: 118.7200, lat: 32.0150, azimuth: 315, bands: ['n78', 'n28'] },
    { cell_id: 'cell_007', cell_name: '奥体北站-NB1', cell_type: 'macro', lng: 118.7260, lat: 32.0140, azimuth: 0, bands: ['n78', 'n28'] },
    { cell_id: 'cell_008', cell_name: '奥体南站-SB1', cell_type: 'macro', lng: 118.7270, lat: 32.0030, azimuth: 180, bands: ['n78', 'n28'] },
  ]);
};

/**
 * 02_Master_User_Dim - 用户主数据字典
 * @returns {Promise<UserDimV2[]>}
 */
export const fetchMasterUserDimV2 = () => {
  return Promise.resolve([
    { user_id: 'usr_001', user_type: 'vip_diamond', msisdn: '139****0001', imei: '860000011111111' },
    { user_id: 'usr_002', user_type: 'vip_gold', msisdn: '139****0002', imei: '860000022222222' },
    { user_id: 'usr_003', user_type: 'regular', msisdn: '139****0003', imei: '860000033333333' },
    { user_id: 'usr_004', user_type: 'venue_package', msisdn: '139****0004', imei: '860000044444444' },
    { user_id: 'usr_005', user_type: 'vip_diamond', msisdn: '139****0005', imei: '860000055555555' },
  ]);
};

// ============================================
// V2 数据契约 - P0 宏观溯源
// ============================================

/**
 * 04_Hub_Pressure_Realtime - 交通枢纽压力实时数据
 * @returns {Promise<HubPressureV2[]>}
 */
export const fetchHubPressureRealtimeV2 = () => {
  const timestamp = Date.now(); // 13位毫秒级时间戳
  return Promise.resolve([
    { 
      hub_id: 'hub_001', 
      hub_name: '奥体地铁站', 
      hub_type: 'metro',
      rrc_users: 28500, 
      baseline_rrc_users: 12000,
      timestamp,
    },
    { 
      hub_id: 'hub_002', 
      hub_name: '南京南站', 
      hub_type: 'railway',
      rrc_users: 45600, 
      baseline_rrc_users: 32000,
      timestamp,
    },
    { 
      hub_id: 'hub_003', 
      hub_name: '南京站', 
      hub_type: 'railway',
      rrc_users: 23800, 
      baseline_rrc_users: 18000,
      timestamp,
    },
    { 
      hub_id: 'hub_004', 
      hub_name: '禄口机场', 
      hub_type: 'airport',
      rrc_users: 19200, 
      baseline_rrc_users: 15000,
      timestamp,
    },
  ]);
};

// ============================================
// V2 数据契约 - P1 全局态势
// ============================================

/**
 * 03_Master_Cell_Perf_Realtime - 小区性能实时数据
 * @returns {Promise<CellPerfV2[]>}
 */
export const fetchCellPerfRealtimeV2 = () => {
  const timestamp = Date.now();
  return Promise.resolve([
    { 
      cell_id: 'cell_001', 
      cell_name: '奥体主站-N1',
      rrc_users: 2847, 
      baseline_rrc_users: 1500,
      prb_util: 72,
      throughput_mbps: 850,
      timestamp,
    },
    { 
      cell_id: 'cell_002', 
      cell_name: '奥体主站-S1',
      rrc_users: 2156, 
      baseline_rrc_users: 1200,
      prb_util: 65,
      throughput_mbps: 720,
      timestamp,
    },
    { 
      cell_id: 'cell_003', 
      cell_name: '奥体东站-E1',
      rrc_users: 3124, 
      baseline_rrc_users: 1800,
      prb_util: 78,
      throughput_mbps: 920,
      timestamp,
    },
    { 
      cell_id: 'cell_005', 
      cell_name: '华彩中心-H1',
      rrc_users: 4521, 
      baseline_rrc_users: 2000,
      prb_util: 85,
      throughput_mbps: 1100,
      timestamp,
    },
  ]);
};

/**
 * 06_KQI_Metric_Realtime - KQI指标实时数据
 * @returns {Promise<KQIMetricV2[]>}
 */
export const fetchKQIMetricRealtimeV2 = () => {
  const timestamp = Date.now();
  return Promise.resolve([
    { 
      metric_id: 'kqi_traffic',
      metric_name: '总流量',
      metric_val: 8420, 
      baseline_val: 7500,
      unit: 'GB',
      timestamp,
    },
    { 
      metric_id: 'kqi_voice',
      metric_name: '语音话务量',
      metric_val: 420, 
      baseline_val: 400,
      unit: 'Erl',
      timestamp,
    },
    { 
      metric_id: 'kqi_throughput',
      metric_name: '平均吞吐',
      metric_val: 520, 
      baseline_val: 530,
      unit: 'Mbps',
      timestamp,
    },
    { 
      metric_id: 'kqi_latency',
      metric_name: '时延',
      metric_val: 12, 
      baseline_val: 13,
      unit: 'ms',
      timestamp,
    },
  ]);
};

// ============================================
// V2 数据契约 - P2 场内微观
// ============================================

/**
 * 07_Zone_User_Agg - 区域用户聚合数据
 * @returns {Promise<ZoneUserAggV2[]>}
 */
export const fetchZoneUserAggV2 = () => {
  const timestamp = Date.now();
  return Promise.resolve([
    { 
      zone_id: 'zone_f', 
      zone_name: '南看台 F区',
      total_users: 8500,
      terminal_5ga: 3200,
      top_devices_json: JSON.stringify([
        { rank: 1, brand: '华为', model: 'Mate 60 Pro', users: 1250, is5GA: true },
        { rank: 2, brand: '苹果', model: 'iPhone 15 Pro', users: 1100, is5GA: true },
        { rank: 3, brand: '小米', model: '14 Pro', users: 890, is5GA: true },
        { rank: 4, brand: '荣耀', model: 'Magic 6', users: 760, is5GA: true },
        { rank: 5, brand: 'vivo', model: 'X100 Pro', users: 620, is5GA: true },
      ]),
      timestamp,
    },
    { 
      zone_id: 'zone_vip', 
      zone_name: '西看台 VIP区',
      total_users: 4200,
      terminal_5ga: 2100,
      top_devices_json: JSON.stringify([
        { rank: 1, brand: '苹果', model: 'iPhone 15 Pro Max', users: 850, is5GA: true },
        { rank: 2, brand: '华为', model: 'Mate X5', users: 720, is5GA: true },
        { rank: 3, brand: '三星', model: 'S24 Ultra', users: 580, is5GA: true },
        { rank: 4, brand: '小米', model: '14 Ultra', users: 450, is5GA: true },
        { rank: 5, brand: 'OPPO', model: 'Find X7', users: 320, is5GA: true },
      ]),
      timestamp,
    },
    { 
      zone_id: 'zone_a', 
      zone_name: '东看台 A区',
      total_users: 6800,
      terminal_5ga: 2400,
      top_devices_json: JSON.stringify([
        { rank: 1, brand: '华为', model: 'Mate 60', users: 980, is5GA: true },
        { rank: 2, brand: '苹果', model: 'iPhone 15', users: 850, is5GA: true },
        { rank: 3, brand: '小米', model: '14', users: 720, is5GA: true },
        { rank: 4, brand: '荣耀', model: 'Magic 6 Pro', users: 580, is5GA: true },
        { rank: 5, brand: 'vivo', model: 'X100', users: 420, is5GA: true },
      ]),
      timestamp,
    },
  ]);
};

// ============================================
// V2 告警事件流
// ============================================

/**
 * 05_Alert_Event_Stream - 告警事件流
 * @returns {Promise<AlertEventV2[]>}
 */
export const fetchAlertEventStreamV2 = () => {
  const timestamp = Date.now();
  return Promise.resolve([
    { 
      alert_id: 'alt_001',
      alert_level: 'high',
      alert_type: 'congestion',
      cell_id: 'cell_005', // 关联华彩中心
      title: '华彩中心拥塞告警',
      description: 'PRB利用率超过85%',
      timestamp: timestamp - 120000,
    },
    { 
      alert_id: 'alt_002',
      alert_level: 'medium',
      alert_type: 'capacity',
      cell_id: 'cell_003', // 关联奥体东站
      title: '奥体东站容量预警',
      description: 'RRC连接数接近上限',
      timestamp: timestamp - 300000,
    },
    { 
      alert_id: 'alt_003',
      alert_level: 'high',
      alert_type: 'interference',
      cell_id: 'cell_001', // 关联奥体主站
      title: '奥体主站干扰告警',
      description: '上行干扰噪声抬升',
      timestamp: timestamp - 600000,
    },
  ]);
};

// ============================================
// V2 数据字典缓存辅助函数
// ============================================

/**
 * 构建 Cell 字典 Map
 * @returns {Promise<Map<string, CellDimV2>>}
 */
export const buildCellDictionaryV2 = async () => {
  const cells = await fetchMasterCellDimV2();
  return new Map(cells.map(cell => [cell.cell_id, cell]));
};

/**
 * 构建 User 字典 Map
 * @returns {Promise<Map<string, UserDimV2>>}
 */
export const buildUserDictionaryV2 = async () => {
  const users = await fetchMasterUserDimV2();
  return new Map(users.map(user => [user.user_id, user]));
};

// ============================================
// V2 衍生指标计算辅助函数
// ============================================

/**
 * 计算压力比率
 * @param {number} rrcUsers - 当前RRC用户数
 * @param {number} baseline - 基线用户数
 * @returns {number} 压力比率
 */
export const calculatePressureRatio = (rrcUsers, baseline) => {
  if (!baseline || baseline === 0) return 0;
  return Number((rrcUsers / baseline).toFixed(2));
};

/**
 * 计算环比变化率
 * @param {number} current - 当前值
 * @param {number} baseline - 基线值
 * @returns {string} 格式化的环比字符串 (+xx% 或 -xx%)
 */
export const calculateMoMChange = (current, baseline) => {
  if (!baseline || baseline === 0) return '0%';
  const change = ((current - baseline) / baseline) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
};

/**
 * 计算5G-A渗透率
 * @param {number} terminal5GA - 5G-A终端数
 * @param {number} totalUsers - 总用户数
 * @returns {number} 渗透率 (0-100)
 */
export const calculate5GAPenetration = (terminal5GA, totalUsers) => {
  if (!totalUsers || totalUsers === 0) return 0;
  return Number(((terminal5GA / totalUsers) * 100).toFixed(1));
};
