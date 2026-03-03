/**
 * AmapL7Scene V2 - 基于 V2 数据契约重构
 * 核心改进：
 * 1. 接入 Store V2 计算指标数据 (pressure_ratio, MoM)
 * 2. 告警联动：通过 cell_id → 字典查询 → 触发地图动画
 * 3. 统一使用 V2 字段命名 (cell_id, lng/lat, timestamp)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, MapPin, X, Activity, Zap, Cpu, Users, Radio } from 'lucide-react';
import { Scene, GaodeMap, PointLayer, HeatmapLayer, PolygonLayer } from '@antv/l7';
import useDashboardStore from '../../store/useDashboardStore.js';

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || '';
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE || '';

// ========== 摄像机视角配置 ==========
const CAMERA_CONFIG = {
  center: [118.728, 32.005],
  zoom: 14.5,
  pitch: 45,
};

const EMPTY_GEOJSON = { type: 'FeatureCollection', features: [] };

// ========== 核心地标数据 ==========
const CUSTOM_LANDMARKS = [
  { name: '南京奥体中心', lng: 118.7265, lat: 32.0087, type: 'main' },
  { name: '奥体东地铁站', lng: 118.7350, lat: 32.0050, type: 'metro' },
  { name: '元通地铁站', lng: 118.7200, lat: 32.0150, type: 'metro' },
  { name: '华彩中心(第二现场)', lng: 118.7400, lat: 32.0120, type: 'secondary' },
];

// ========== 应急通信车位置 ==========
const EMERGENCY_VEHICLES = [
  { id: 'EV-001', name: '应急通信车-东', lng: 118.7305, lat: 32.0080, status: 'active' },
  { id: 'EV-002', name: '应急通信车-西', lng: 118.7215, lat: 32.0080, status: 'active' },
];

// ========== 保障人员数据 ==========
function generateGroundStaff() {
  const staff = [];
  const centerLng = 118.728;
  const centerLat = 32.005;
  
  for (let i = 0; i < 16; i++) {
    const lng = centerLng + (Math.random() - 0.5) * 0.012;
    const lat = centerLat + (Math.random() - 0.5) * 0.012;
    staff.push({
      id: `STAFF-${i + 1}`,
      lng,
      lat,
      role: i < 4 ? '工程师' : '巡检员',
    });
  }
  return staff;
}

// ========== 热力图数据 ==========
function generateCrowdHeatData(currentTime) {
  const hour = parseInt(currentTime?.split(':')[0] || '20');
  const isPeak = hour >= 19 && hour <= 21;
  const baseMultiplier = isPeak ? 1.5 : 1;
  
  const points = [];
  const hotspots = [
    { lng: 118.7265, lat: 32.0087, intensity: 1.0 },
    { lng: 118.7400, lat: 32.0120, intensity: 0.7 },
    { lng: 118.7350, lat: 32.0050, intensity: 0.8 },
    { lng: 118.7200, lat: 32.0150, intensity: 0.6 },
  ];
  
  hotspots.forEach(hotspot => {
    const pointCount = Math.floor(100 * hotspot.intensity);
    for (let i = 0; i < pointCount; i++) {
      const lng = hotspot.lng + (Math.random() - 0.5) * 0.008;
      const lat = hotspot.lat + (Math.random() - 0.5) * 0.008;
      const count = Math.floor((Math.random() * 80 + 20) * hotspot.intensity * baseMultiplier);
      points.push({ lng, lat, count });
    }
  });
  
  for (let i = 0; i < 100; i++) {
    const lng = 118.728 + (Math.random() - 0.5) * 0.02;
    const lat = 32.005 + (Math.random() - 0.5) * 0.02;
    const count = Math.floor(Math.random() * 40 * baseMultiplier);
    points.push({ lng, lat, count });
  }
  
  return points;
}

// ========== 全局高德安全配置 ==========
if (typeof window !== 'undefined') {
  window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE };
}

// ========== V2 详情面板组件 ==========
function StationDetailPanelV2({ data, onClose }) {
  if (!data) return null;
  
  const getPrbColor = (prb) => {
    if (prb < 50) return 'bg-green-500';
    if (prb < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // V2 数据字段映射
  const cellName = data.cell_name || data.name;
  const cellId = data.cell_id || data.id;
  const users = data.rrc_users ?? data.users ?? 0;
  const baseline = data.baseline_rrc_users ?? data.baseline ?? 0;
  const prb = data.prb_util ?? data.prb ?? 0;
  const ratio = data.pressure_ratio ?? (baseline ? (users / baseline).toFixed(2) : 0);
  const mom = data.pressure_mom ?? (baseline ? (((users - baseline) / baseline) * 100).toFixed(1) : 0);
  
  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 z-[200] w-80">
      <div className="glass-panel rounded-xl p-5 border border-cyan-400/40 backdrop-blur-md bg-[#0B1A2A]/85">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-600/30 flex items-center justify-center border border-cyan-400/30">
              <Radio className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">{cellName}</h3>
              <p className="text-cyan-400/70 text-xs font-mono">{cellId}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>
        
        {/* 基础状态 - V2 字段 */}
        <div className="mb-5">
          <h4 className="text-cyan-400 text-xs font-bold mb-3 uppercase tracking-wider">实时性能 (V2)</h4>
          <div className="grid grid-cols-2 gap-3">
            {/* 经纬度 */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-white/40 text-[10px] mb-1">坐标 (lng, lat)</div>
              <div className="text-white font-mono text-xs">
                {data.lng?.toFixed(4)}, {data.lat?.toFixed(4)}
              </div>
            </div>
            
            {/* RRC 连接用户数 */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-white/40 text-[10px] mb-1">RRC连接用户</div>
              <div className="text-cyan-400 font-bold text-lg">{users.toLocaleString()}</div>
            </div>
            
            {/* 压力比率 - V2 新增计算指标 */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-white/40 text-[10px] mb-1">压力比率 (ratio)</div>
              <div className={`font-bold text-lg ${ratio > 2.0 ? 'text-red-400' : ratio > 1.5 ? 'text-yellow-400' : 'text-green-400'}`}>
                {ratio}x
              </div>
              <div className="text-white/30 text-[10px]">基线: {baseline.toLocaleString()}</div>
            </div>
            
            {/* 环比变化 */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-white/40 text-[10px] mb-1">环比变化 (MoM)</div>
              <div className={`font-bold text-lg ${parseFloat(mom) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {parseFloat(mom) > 0 ? '+' : ''}{mom}%
              </div>
            </div>
            
            {/* PRB 利用率 */}
            <div className="col-span-2 bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/40 text-[10px]">PRB 利用率</span>
                <span className={`font-bold text-sm ${prb < 50 ? 'text-green-400' : prb < 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {prb}%
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${getPrbColor(prb)}`}
                  style={{ width: `${prb}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* 硬件配置 */}
        <div className="mb-4">
          <h4 className="text-cyan-400 text-xs font-bold mb-3 uppercase tracking-wider">硬件配置</h4>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-white/60 text-xs">基站型号</span>
            <span className="text-white font-mono text-xs">5G-A Macro 64T64R</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-white/60 text-xs">载波配置</span>
            <div className="flex items-center gap-1">
              <span className="text-cyan-400 text-xs">3CC 载波聚合</span>
              <span className="text-white/40 text-[10px]">(n28+n78+n79)</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-white/60 text-xs">无线智能板</span>
            <div className="flex items-center gap-2">
              <img 
                src="/icons/smart-board.svg" 
                alt="smart-board" 
                className={`w-5 h-5 ${data.hasSmartBoard ? 'opacity-100' : 'opacity-40 grayscale'}`}
              />
              <span className={`text-xs font-bold ${data.hasSmartBoard ? 'text-green-400' : 'text-white/40'}`}>
                {data.hasSmartBoard ? '已激活' : '未配置'}
              </span>
            </div>
          </div>
        </div>
        
        {/* 底部状态栏 */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${data.aauStatus === 'normal' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className={`text-xs ${data.aauStatus === 'normal' ? 'text-green-400' : 'text-red-400'}`}>
              AAU {data.aauStatus === 'normal' ? '正常运行' : '告警'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span className="text-white/40 text-xs">BBU {data.bbuLoad}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AmapL7SceneV2({ onStationClick, currentTime = '20:00', onAlertsChange }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const isInitializingRef = useRef(false);
  const isDestroyedRef = useRef(false);
  
  const layersRef = useRef({
    heatmap: null,
    zone: null,
    station: null,
    landmark: null,
    vehicle: null,
    staff: null,
    alert: null,
  });
  
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [staffData] = useState(() => generateGroundStaff());
  const [crowdHeatData, setCrowdHeatData] = useState(() => generateCrowdHeatData('20:00'));

  // ===== V2 Store 集成 =====
  const { 
    getComputedCellPerf, 
    alertEventStream, 
    getCellCoordinates,
    initDictionaries,
    fetchV2RealtimeData,
    setTriggerMapAlert,
  } = useDashboardStore();

  // 初始化数据字典和实时数据
  useEffect(() => {
    initDictionaries();
    fetchV2RealtimeData();
    // 注册地图告警触发器
    setTriggerMapAlert((lng, lat, level) => {
      triggerMapAlertAnimation(lng, lat, level);
    });
  }, []);

  // ===== 告警联动：通过 cell_id 触发地图动画 =====
  const triggerMapAlertAnimation = useCallback((lng, lat, level) => {
    if (!sceneRef.current || isDestroyedRef.current) return;
    
    console.log('[AmapL7Scene V2] 触发告警动画:', { lng, lat, level });
    
    // 创建临时告警图层或移动现有告警图层
    if (layersRef.current.alert) {
      const alertGeojson = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: { level, id: `ALERT-${Date.now()}` },
          geometry: { type: 'Point', coordinates: [lng, lat] }
        }]
      };
      layersRef.current.alert.setData(alertGeojson);
      
      // 3秒后清除
      setTimeout(() => {
        if (layersRef.current.alert && !isDestroyedRef.current) {
          layersRef.current.alert.setData(EMPTY_GEOJSON);
        }
      }, 3000);
    }
  }, []);

  // 监听告警事件流变化
  useEffect(() => {
    if (alertEventStream.length === 0) return;
    
    const latestAlert = alertEventStream[0];
    if (latestAlert.cell_id) {
      // 通过字典查询经纬度
      const coords = getCellCoordinates(latestAlert.cell_id);
      if (coords) {
        triggerMapAlertAnimation(coords.lng, coords.lat, latestAlert.alert_level);
      }
    }
  }, [alertEventStream, getCellCoordinates, triggerMapAlertAnimation]);

  // 地图初始化
  useEffect(() => {
    if (isInitializingRef.current || sceneRef.current) {
      console.log('[AmapL7Scene V2] 拦截重复初始化');
      return;
    }
    
    isInitializingRef.current = true;
    isDestroyedRef.current = false;
    
    const container = containerRef.current;
    if (!container) {
      setError('地图容器未找到');
      setLoading(false);
      isInitializingRef.current = false;
      return;
    }

    if (!AMAP_KEY) {
      setError('高德 Key 未配置');
      setLoading(false);
      isInitializingRef.current = false;
      return;
    }

    let scene = null;
    let isEffectActive = true;

    const initMap = async () => {
      try {
        scene = new Scene({
          id: container,
          map: new GaodeMap({
            ...CAMERA_CONFIG,
            viewMode: '3D',
            style: 'amap://styles/darkblue',
            token: AMAP_KEY,
            features: ['bg', 'road', 'building'],
          }),
          logoVisible: false,
        });

        scene.setBgColor('#0B1A2A');
        sceneRef.current = scene;

        if (!scene) {
          console.error('[AmapL7Scene V2] Scene 创建失败');
          setError('地图引擎初始化失败');
          setLoading(false);
          isInitializingRef.current = false;
          return;
        }

        scene.on('loaded', async () => {
          if (!isEffectActive || isDestroyedRef.current) {
            console.log('[AmapL7Scene V2] 组件已卸载，放弃图层初始化');
            if (scene && !scene.destroyed) {
              try { scene.destroy(); } catch (e) {}
            }
            return;
          }
          
          try {
            await Promise.all([
              scene.addImage('comm-vehicle', '/icons/comm-vehicle.svg'),
              scene.addImage('smart-board', '/icons/smart-board.svg'),
            ]).catch(() => console.warn('[AmapL7Scene V2] 部分图标加载失败'));

            // 1. 热力图层
            const heatmapLayer = new HeatmapLayer({ zIndex: 1 })
              .source(crowdHeatData, {
                parser: { type: 'json', x: 'lng', y: 'lat' },
              })
              .shape('heatmap')
              .size('count', [0, 1])
              .style({
                intensity: 2,
                radius: 30,
                opacity: 0.8,
                rampColors: {
                  colors: [
                    'rgba(11, 26, 42, 0)',
                    '#0891b2',
                    '#10b981',
                    '#fbbf24',
                    '#ef4444'
                  ],
                  positions: [0, 0.2, 0.4, 0.7, 1.0]
                }
              });
            scene.addLayer(heatmapLayer);
            layersRef.current.heatmap = heatmapLayer;

            // 2. 监控区域图层
            const zoneLayer = new PolygonLayer({ zIndex: 2 })
              .source(EMPTY_GEOJSON, { parser: { type: 'geojson' } })
              .color('rgba(0, 240, 255, 0.2)')
              .shape('extrude')
              .size(30)
              .style({ opacity: 0.5 });
            scene.addLayer(zoneLayer);
            layersRef.current.zone = zoneLayer;

            // 3. 地标图层
            const landmarkLayer = new PointLayer({ zIndex: 10 })
              .source({
                type: 'FeatureCollection',
                features: CUSTOM_LANDMARKS.map(lm => ({
                  type: 'Feature',
                  properties: { name: lm.name, type: lm.type },
                  geometry: { type: 'Point', coordinates: [lm.lng, lm.lat] }
                }))
              }, { parser: { type: 'geojson' } })
              .shape('name', 'text')
              .size(14)
              .color('#fbbf24')
              .style({ textAnchor: 'center', textOffset: [0, -20], stroke: '#000', strokeWidth: 2 });
            scene.addLayer(landmarkLayer);
            layersRef.current.landmark = landmarkLayer;

            // 4. 应急通信车图层
            const vehicleLayer = new PointLayer({ zIndex: 8 })
              .source({
                type: 'FeatureCollection',
                features: EMERGENCY_VEHICLES.map(v => ({
                  type: 'Feature',
                  properties: { ...v },
                  geometry: { type: 'Point', coordinates: [v.lng, v.lat] }
                }))
              }, { parser: { type: 'geojson' } })
              .shape('comm-vehicle')
              .size(28);
            scene.addLayer(vehicleLayer);
            layersRef.current.vehicle = vehicleLayer;

            // 5. 基站图层 - V2：使用 Store 数据
            const cellPerfData = getComputedCellPerf();
            const stationGeojson = {
              type: 'FeatureCollection',
              features: cellPerfData.length > 0 
                ? cellPerfData.map(s => ({
                    type: 'Feature',
                    properties: { ...s },
                    geometry: { type: 'Point', coordinates: [s.lng, s.lat] }
                  }))
                : [] // 如果 V2 数据未加载，先不显示基站
            };
            
            const stationLayer = new PointLayer({ zIndex: 6 })
              .source(stationGeojson, { parser: { type: 'geojson' } })
              .shape('sector-site')
              .size(30)
              .style({ opacity: 1 });
            scene.addLayer(stationLayer);
            layersRef.current.station = stationLayer;

            // 点击事件
            stationLayer.on('click', (e) => {
              if (e.feature) {
                const station = e.feature.properties;
                setSelectedStation(station);
                if (onStationClick) onStationClick(station);
              }
            });

            // 6. 保障人员图层
            const staffLayer = new PointLayer({ zIndex: 7 })
              .source({
                type: 'FeatureCollection',
                features: staffData.map(s => ({
                  type: 'Feature',
                  properties: { ...s },
                  geometry: { type: 'Point', coordinates: [s.lng, s.lat] }
                }))
              }, { parser: { type: 'geojson' } })
              .shape('circle')
              .color('#22c55e')
              .size(6)
              .style({ opacity: 0.8 });
            scene.addLayer(staffLayer);
            layersRef.current.staff = staffLayer;

            // 7. 告警呼吸灯图层
            const alertLayer = new PointLayer({ zIndex: 12 })
              .source(EMPTY_GEOJSON, { parser: { type: 'geojson' } })
              .shape('circle')
              .color('#ef4444')
              .size(25)
              .animate({ enable: true, speed: 1, rings: 3 })
              .style({ opacity: 0.9 });
            scene.addLayer(alertLayer);
            layersRef.current.alert = alertLayer;

            if (isEffectActive && !isDestroyedRef.current) {
              setSceneLoaded(true);
              setLoading(false);
              console.log('[AmapL7Scene V2] 地图初始化完成');
            }
          } catch (layerErr) {
            console.error('[AmapL7Scene V2] 图层初始化错误:', layerErr);
            if (isEffectActive) {
              setError('图层初始化失败: ' + layerErr.message);
              setLoading(false);
            }
          }
        });

        if (scene) {
          scene.on('error', (err) => {
            console.error('[AmapL7Scene V2] 场景错误:', err);
            if (isEffectActive && !isDestroyedRef.current) {
              setError('地图渲染失败');
              setLoading(false);
            }
          });
        }

      } catch (err) {
        console.error('[AmapL7Scene V2] 初始化严重异常:', err);
        if (isEffectActive) {
          setError(err.message || '地图初始化失败');
          setLoading(false);
        }
      } finally {
        isInitializingRef.current = false;
      }
    };

    initMap();

    return () => {
      isEffectActive = false;
      isDestroyedRef.current = true;
      if (sceneRef.current) {
        try {
          sceneRef.current.destroy();
        } catch (e) {}
        sceneRef.current = null;
      }
      layersRef.current = { heatmap: null, zone: null, station: null, landmark: null, vehicle: null, staff: null, alert: null };
      isInitializingRef.current = false;
    };
  }, []);

  // 更新热力图
  useEffect(() => {
    if (!sceneLoaded || !sceneRef.current || isDestroyedRef.current) return;
    
    const newHeatData = generateCrowdHeatData(currentTime);
    setCrowdHeatData(newHeatData);
    
    if (layersRef.current.heatmap) {
      try {
        layersRef.current.heatmap.setData(newHeatData);
      } catch (err) {
        console.error('[AmapL7Scene V2] 更新热力图失败:', err);
      }
    }
  }, [sceneLoaded, currentTime]);

  // 更新基站图层 (V2 数据)
  useEffect(() => {
    if (!sceneLoaded || !sceneRef.current || isDestroyedRef.current) return;
    
    const cellPerfData = getComputedCellPerf();
    if (cellPerfData.length > 0 && layersRef.current.station) {
      try {
        const geojson = {
          type: 'FeatureCollection',
          features: cellPerfData.map(s => ({
            type: 'Feature',
            properties: { ...s },
            geometry: { type: 'Point', coordinates: [s.lng, s.lat] }
          }))
        };
        layersRef.current.station.setData(geojson);
      } catch (err) {
        console.error('[AmapL7Scene V2] 更新基站图层失败:', err);
      }
    }
  }, [sceneLoaded, getComputedCellPerf]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0B1A2A]">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      
      {(loading || !sceneLoaded) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0B1A2A]/90 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-3" />
            <div className="text-cyan-400 text-lg">初始化 V2 地图...</div>
            {!AMAP_KEY && <div className="text-yellow-400 text-sm mt-2">缺少高德地图 Key 配置</div>}
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0B1A2A]/90 backdrop-blur-sm">
          <div className="text-center text-yellow-400 max-w-md px-4">
            <div className="text-xl font-bold mb-2">地图加载失败</div>
            <div className="text-sm text-white/60">{error}</div>
          </div>
        </div>
      )}
      
      {/* V2 详情面板 */}
      <StationDetailPanelV2 data={selectedStation} onClose={() => setSelectedStation(null)} />
      
      {/* 图例面板 */}
      {sceneLoaded && (
        <div className="absolute bottom-4 left-4 bg-cyber-panel/90 rounded-lg p-3 border border-cyan-400/30 z-10 max-w-[220px]">
          <div className="text-cyan-400 text-xs font-bold mb-2">图例 (V2)</div>
          <div className="space-y-1.5 text-[10px] text-white/70">
            <div className="flex items-center gap-2">
              <span className="w-6 h-3 rounded bg-gradient-to-t from-cyan-500/60 via-green-500/60 to-red-500/60" />
              <span>3D 热力密度</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-yellow-500/50" />
              <span>智能板基站</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-cyan-400 border-2 border-cyan-500/50" />
              <span>5G 基站</span>
            </div>
            <div className="flex items-center gap-2">
              <img src="/icons/comm-vehicle.svg" className="w-4 h-4" alt="" />
              <span>应急通信车</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span>保障人员</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span>告警联动 (cell_id)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
