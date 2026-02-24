/**
 * 地图数据配置
 * GeoJSON 数据源配置
 */

export const GEOJSON_URLS = {
  china: '/china.json',
  jiangsu: '/jiangsu.json',
};

export const CITY_COORDS = {
  national: {
    '南京': [118.796877, 32.060255],
    '上海': [121.473701, 31.230416],
    '杭州': [120.15507, 30.274084],
    '合肥': [117.227239, 31.820586],
    '北京': [116.407526, 39.90403],
    '深圳': [114.057868, 22.543099],
    '武汉': [114.305393, 30.593099],
    '成都': [104.066541, 30.572269],
    '西安': [108.93977, 34.341574],
  },
  jiangsu: {
    '南京': [118.796877, 32.060255],
    '苏州': [120.585316, 31.298886],
    '无锡': [120.31191, 31.49117],
    '常州': [119.974061, 31.811226],
    '南通': [120.894291, 31.980171],
    '徐州': [117.284124, 34.205768],
    '扬州': [119.421003, 32.393159],
    '盐城': [120.163561, 33.347382],
    '泰州': [119.923116, 32.455778],
  }
};

export const MIGRATION_DATA = {
  national: [
    { from: '上海', to: '南京', value: 15200 },
    { from: '杭州', to: '南京', value: 9100 },
    { from: '合肥', to: '南京', value: 7800 },
    { from: '北京', to: '南京', value: 6500 },
    { from: '深圳', to: '南京', value: 4800 },
    { from: '武汉', to: '南京', value: 4200 },
    { from: '成都', to: '南京', value: 3600 },
    { from: '西安', to: '南京', value: 3100 },
  ],
  jiangsu: [
    { from: '苏州', to: '南京', value: 12400 },
    { from: '无锡', to: '南京', value: 8900 },
    { from: '常州', to: '南京', value: 7200 },
    { from: '南通', to: '南京', value: 5800 },
    { from: '徐州', to: '南京', value: 4200 },
    { from: '扬州', to: '南京', value: 3800 },
    { from: '盐城', to: '南京', value: 2900 },
    { from: '泰州', to: '南京', value: 2500 },
  ]
};

export const getFlowColor = (value, maxValue) => {
  const ratio = value / maxValue;
  if (ratio > 0.8) return '#FF3333';
  if (ratio > 0.6) return '#FFD700';
  if (ratio > 0.4) return '#00F0FF';
  if (ratio > 0.2) return '#1E90FF';
  return '#4B5563';
};

export const FLOW_LEGEND = [
  { color: '#FF3333', label: '>12k', desc: '极高' },
  { color: '#FFD700', label: '8-12k', desc: '高' },
  { color: '#00F0FF', label: '5-8k', desc: '中高' },
  { color: '#1E90FF', label: '3-5k', desc: '中' },
  { color: '#4B5563', label: '<3k', desc: '一般' },
];
