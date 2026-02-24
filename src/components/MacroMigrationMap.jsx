import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { Globe, Map as MapIcon, Info } from 'lucide-react';

// GeoJSON 数据 URL - 使用本地静态资源避免跨域问题
const GEOJSON_URLS = {
  china: '/china.json',
  jiangsu: '/jiangsu.json',
};

// 城市坐标 - 只包含有迁徙数据的来源地和南京
const CITY_COORDS = {
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

// 迁徙数据
const MIGRATION_DATA = {
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

function getFlowColor(value, maxValue) {
  const ratio = value / maxValue;
  if (ratio > 0.8) return '#FF3333';
  if (ratio > 0.6) return '#FFD700';
  if (ratio > 0.4) return '#00F0FF';
  if (ratio > 0.2) return '#1E90FF';
  return '#4B5563';
}

const flowLegend = [
  { color: '#FF3333', label: '>12k', desc: '极高' },
  { color: '#FFD700', label: '8-12k', desc: '高' },
  { color: '#00F0FF', label: '5-8k', desc: '中高' },
  { color: '#1E90FF', label: '3-5k', desc: '中' },
  { color: '#4B5563', label: '<3k', desc: '一般' },
];

export default function MacroMigrationMap() {
  const [mapMode, setMapMode] = useState('national');
  const [geoJsonData, setGeoJsonData] = useState({ china: null, jiangsu: null });
  const [loading, setLoading] = useState(true);

  // 加载 GeoJSON
  useEffect(() => {
    const loadGeoJson = async () => {
      try {
        setLoading(true);
        
        if (!geoJsonData.china) {
          const chinaRes = await fetch(GEOJSON_URLS.china);
          const chinaJson = await chinaRes.json();
          echarts.registerMap('china', chinaJson);
          setGeoJsonData(prev => ({ ...prev, china: chinaJson }));
        }
        
        if (!geoJsonData.jiangsu) {
          const jsRes = await fetch(GEOJSON_URLS.jiangsu);
          const jsJson = await jsRes.json();
          echarts.registerMap('jiangsu', jsJson);
          setGeoJsonData(prev => ({ ...prev, jiangsu: jsJson }));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('本地 GeoJSON 加载失败:', error);
        setLoading(false);
      }
    };

    loadGeoJson();
  }, []);

  // 构建迁徙线路数据
  const linesData = useMemo(() => {
    const data = mapMode === 'national' ? MIGRATION_DATA.national : MIGRATION_DATA.jiangsu;
    const coords = mapMode === 'national' ? CITY_COORDS.national : CITY_COORDS.jiangsu;
    const maxValue = Math.max(...data.map(d => d.value));
    
    return data.map(item => ({
      coords: [coords[item.from], coords['南京']],
      lineStyle: {
        color: getFlowColor(item.value, maxValue),
        width: Math.max(1, (item.value / maxValue) * 4),
        opacity: 0.8,
        curveness: 0.3,
      },
      value: item.value,
      from: item.from,
    }));
  }, [mapMode]);

  // 构建城市点数据 - 只显示有迁徙数据的城市和南京
  const scatterData = useMemo(() => {
    const coords = mapMode === 'national' ? CITY_COORDS.national : CITY_COORDS.jiangsu;
    const data = mapMode === 'national' ? MIGRATION_DATA.national : MIGRATION_DATA.jiangsu;
    const maxValue = Math.max(...data.map(d => d.value));
    
    // 只包含有迁徙数据的城市和南京
    const relevantCities = ['南京', ...data.map(d => d.from)];
    
    return relevantCities.map((name) => {
      const coord = coords[name];
      const migrationItem = data.find(d => d.from === name);
      const value = migrationItem?.value || 0;
      const isNanjing = name === '南京';
      
      return {
        name,
        value: [...coord, value],
        itemStyle: {
          color: isNanjing ? '#FFD700' : getFlowColor(value, maxValue),
          shadowBlur: isNanjing ? 30 : 15,
          shadowColor: isNanjing ? '#FFD700' : getFlowColor(value, maxValue),
        },
        label: {
          show: true,
          formatter: name,
          fontSize: isNanjing ? 14 : 11,
          fontWeight: isNanjing ? 'bold' : 'normal',
          color: isNanjing ? '#FFD700' : '#00F0FF',
          offset: isNanjing ? [0, -25] : [0, -15],
        },
        symbolSize: isNanjing ? 20 : Math.max(8, (value / maxValue) * 15),
        emphasis: { scale: 1.5 },
      };
    });
  }, [mapMode]);

  // ECharts 配置
  const option = useMemo(() => {
    const isJiangsu = mapMode === 'jiangsu';
    
    return {
      backgroundColor: 'transparent',
      geo: {
        map: isJiangsu ? 'jiangsu' : 'china',
        roam: true,
        zoom: isJiangsu ? 1.2 : 1.1,
        center: isJiangsu ? [119.5, 32.8] : [105, 36],
        // 不显示省份标签，只显示迁徙相关城市
        label: {
          show: false,
        },
        itemStyle: {
          areaColor: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 240, 255, 0.08)' },
              { offset: 1, color: 'rgba(0, 240, 255, 0.03)' }
            ]
          },
          // 调暗边框发光效果
          borderColor: 'rgba(0, 240, 255, 0.3)',
          borderWidth: 1,
          shadowColor: 'rgba(0, 240, 255, 0.15)',
          shadowBlur: 8,
          shadowOffsetY: 2,
        },
        emphasis: {
          label: { show: false },
          itemStyle: {
            areaColor: 'rgba(0, 240, 255, 0.12)',
            borderColor: 'rgba(0, 240, 255, 0.5)',
            borderWidth: 1.5,
            shadowColor: 'rgba(0, 240, 255, 0.3)',
            shadowBlur: 12,
          }
        },
      },
      series: [
        // 迁徙飞线
        {
          type: 'lines',
          coordinateSystem: 'geo',
          zlevel: 2,
          effect: {
            show: true,
            period: 6,
            trailLength: 0.7,
            color: '#FFD700',
            symbol: 'arrow',
            symbolSize: 5,
          },
          lineStyle: {
            curveness: 0.3,
            opacity: 0.6,
          },
          data: linesData,
        },
        // 城市点 - 南京金色脉冲效果
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          zlevel: 3,
          rippleEffect: {
            brushType: 'stroke',
            scale: 5,
            period: 3,
          },
          data: scatterData,
        },
      ],
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(13, 20, 30, 0.9)',
        borderColor: 'rgba(0, 240, 255, 0.3)',
        textStyle: { color: '#fff' },
        formatter: (params) => {
          if (params.seriesType === 'lines') {
            return `<div style="padding: 8px;">
              <div style="color: #FFD700; font-weight: bold; margin-bottom: 4px;">${params.data.from} → 南京</div>
              <div style="color: #00F0FF;">球迷数量: <span style="font-size: 16px; font-weight: bold;">${params.data.value.toLocaleString()}</span> 人</div>
            </div>`;
          }
          if (params.seriesType === 'effectScatter') {
            const isNanjing = params.name === '南京';
            const value = params.value[2];
            if (isNanjing) {
              return `<div style="padding: 8px;">
                <div style="color: #FFD700; font-weight: bold; font-size: 14px;">🏟️ 南京 · 奥体中心</div>
                <div style="color: #00F0FF; margin-top: 4px;">比赛目的地</div>
              </div>`;
            }
            return `<div style="padding: 8px;">
              <div style="color: #00F0FF; font-weight: bold; margin-bottom: 4px;">${params.name}</div>
              <div style="color: rgba(255,255,255,0.7);">前往南京: ${value > 0 ? value.toLocaleString() + ' 人' : '目的地'}</div>
            </div>`;
          }
          return params.name;
        },
      },
    };
  }, [mapMode, linesData, scatterData]);

  if (loading) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-cyber-cyan text-lg font-din mb-2">加载地理数据中...</div>
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-cyber-cyan animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* ECharts 地图 */}
      <ReactECharts
        option={option}
        style={{ width: '100%', height: '100%' }}
        notMerge={true}
        lazyUpdate={false}
      />

      {/* 地图模式切换 */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
        <motion.div 
          initial={{ x: -50, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }} 
          className="glass-panel rounded-lg p-1.5 flex gap-1 border border-cyber-cyan/20"
        >
          <button 
            onClick={() => setMapMode('national')} 
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-300 ${
              mapMode === 'national' 
                ? 'bg-cyber-gold text-cyber-bg shadow-lg shadow-cyber-gold/30' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>全国视图</span>
          </button>
          <button 
            onClick={() => setMapMode('jiangsu')} 
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-300 ${
              mapMode === 'jiangsu' 
                ? 'bg-cyber-cyan text-cyber-bg shadow-lg shadow-cyber-cyan/30' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>江苏视图</span>
          </button>
        </motion.div>

        {/* 流量图例 */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }} 
          transition={{ delay: 0.1 }} 
          className="glass-panel rounded-lg p-3 z-20 border border-cyber-cyan/20"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Info className="w-3.5 h-3.5 text-cyber-cyan" />
            <span className="text-white/80 text-xs font-medium">球迷流量强度</span>
          </div>
          <div className="space-y-1.5">
            {flowLegend.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div 
                  className="w-6 h-1.5 rounded-sm" 
                  style={{ 
                    backgroundColor: item.color, 
                    boxShadow: `0 0 6px ${item.color}` 
                  }} 
                />
                <span className="text-white/70 text-[10px] font-mono">{item.label}</span>
                <span className="text-white/40 text-[9px]">· {item.desc}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 右侧统计信息 */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
        <motion.div 
          initial={{ x: 50, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }} 
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-lg p-3 border border-cyber-gold/30"
        >
          <div className="text-white/60 text-[10px] mb-1">当前主要来源</div>
          <div className="text-cyber-gold text-lg font-din font-bold">
            {mapMode === 'national' ? '上海' : '苏州'}
          </div>
          <div className="text-white/40 text-[9px] mt-0.5">
            {mapMode === 'national' ? '15,200 人' : '12,400 人'}
          </div>
        </motion.div>

        <motion.div 
          initial={{ x: 50, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }} 
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-lg p-3 border border-cyber-cyan/30"
        >
          <div className="text-white/60 text-[10px] mb-1">目的地</div>
          <div className="text-cyber-cyan text-lg font-din font-bold">南京</div>
          <div className="text-white/40 text-[9px] mt-0.5">
            奥体中心体育场
          </div>
        </motion.div>
      </div>
    </div>
  );
}
