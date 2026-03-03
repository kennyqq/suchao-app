import { useEffect, useRef, useState } from 'react';
import { Loader2, Train, Building2, Footprints, Radio, Zap, Cpu, Antenna, Settings } from 'lucide-react';
import { Scene, GaodeMap, PointLayer, LineLayer, PolygonLayer } from '@antv/l7';
import { fetchZoneData } from '../../api/dashboard.js';

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || '';
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE || '';

// ========== 地图视角配置 ==========
const CAMERA_CONFIG = {
  center: [118.728, 32.005],
  zoom: 14.5,
  pitch: 50,
};

const EMPTY_GEOJSON = { type: 'FeatureCollection', features: [] };

// ========== 奥体中心坐标 ==========
const OLYMPIC_CENTER = {
  name: '南京奥体中心',
  lng: 118.7265,
  lat: 32.0087,
  type: 'destination'
};

// ========== 简化的交通枢纽数据 ==========
const TRANSPORT_HUBS = [
  { id: 'metro_1', name: '奥体东地铁站', lng: 118.7350, lat: 32.0050, type: 'metro', flow: 8500 },
  { id: 'metro_2', name: '元通地铁站', lng: 118.7200, lat: 32.0150, type: 'metro', flow: 6200 },
  { id: 'metro_3', name: '奥体中心地铁站', lng: 118.7240, lat: 32.0100, type: 'metro', flow: 12000 },
  { id: 'venue_1', name: '华彩中心(第二现场)', lng: 118.7400, lat: 32.0120, type: 'secondary', flow: 4500 },
];

// ========== 应急通信车详细数据 ==========
const EMERGENCY_VEHICLES = [
  { 
    id: 'EV-001', 
    name: '应急通信车-东', 
    lng: 118.7320, 
    lat: 32.0095, 
    status: 'active',
    cellId: 'CELL-EV-001',
    stationType: '应急通信车',
    config: {
      hasSmartBoard: true,
      carrier: '4T4R',
      has3CC: true,
      bands: 'n78+n79',
    },
    users: 1256,
    prb: 68,
    coverage: '500m',
    bandwidth: '100MHz',
  },
  { 
    id: 'EV-002', 
    name: '应急通信车-西', 
    lng: 118.7210, 
    lat: 32.0075, 
    status: 'active',
    cellId: 'CELL-EV-002',
    stationType: '应急通信车',
    config: {
      hasSmartBoard: true,
      carrier: '4T4R',
      has3CC: true,
      bands: 'n78+n79',
    },
    users: 987,
    prb: 52,
    coverage: '500m',
    bandwidth: '100MHz',
  },
];

// ========== 基站详细数据 ==========
const BASE_STATIONS = [
  { 
    id: 'BS-001', 
    name: '奥体主站-北', 
    lng: 118.7265, 
    lat: 32.0130, 
    cellId: 'CELL-001',
    stationType: '宏站',
    type: 'main', 
    status: 'normal',
    config: {
      hasSmartBoard: true,
      carrier: '64T64R',
      has3CC: true,
      bands: 'n28+n78+n79',
    },
    users: 2847, 
    prb: 72,
    bandwidth: '100+100+60MHz',
  },
  { 
    id: 'BS-002', 
    name: '奥体主站-南', 
    lng: 118.7265, 
    lat: 32.0045, 
    cellId: 'CELL-002',
    stationType: '宏站',
    type: 'main', 
    status: 'normal',
    config: {
      hasSmartBoard: true,
      carrier: '64T64R',
      has3CC: true,
      bands: 'n28+n78+n79',
    },
    users: 2156, 
    prb: 65,
    bandwidth: '100+100+60MHz',
  },
  { 
    id: 'BS-003', 
    name: '奥体主站-东', 
    lng: 118.7320, 
    lat: 32.0087, 
    cellId: 'CELL-003',
    stationType: '宏站',
    type: 'sub', 
    status: 'warning',
    config: {
      hasSmartBoard: false,
      carrier: '32T32R',
      has3CC: false,
      bands: 'n78',
    },
    users: 3124, 
    prb: 88,
    bandwidth: '100MHz',
  },
  { 
    id: 'BS-004', 
    name: '奥体主站-西', 
    lng: 118.7210, 
    lat: 32.0087, 
    cellId: 'CELL-004',
    stationType: '宏站',
    type: 'sub', 
    status: 'normal',
    config: {
      hasSmartBoard: false,
      carrier: '32T32R',
      has3CC: false,
      bands: 'n78',
    },
    users: 1832, 
    prb: 52,
    bandwidth: '100MHz',
  },
  { 
    id: 'BS-005', 
    name: '华彩中心站', 
    lng: 118.7400, 
    lat: 32.0120, 
    cellId: 'CELL-005',
    stationType: '微站',
    type: 'sub', 
    status: 'normal',
    config: {
      hasSmartBoard: true,
      carrier: '4T4R',
      has3CC: true,
      bands: 'n78+n79',
    },
    users: 4521, 
    prb: 85,
    bandwidth: '100+100MHz',
  },
  { 
    id: 'BS-006', 
    name: '元通枢纽站', 
    lng: 118.7200, 
    lat: 32.0150, 
    cellId: 'CELL-006',
    stationType: '微站',
    type: 'sub', 
    status: 'normal',
    config: {
      hasSmartBoard: false,
      carrier: '4T4R',
      has3CC: false,
      bands: 'n78',
    },
    users: 1987, 
    prb: 58,
    bandwidth: '100MHz',
  },
  { 
    id: 'BS-007', 
    name: '奥体东站', 
    lng: 118.7350, 
    lat: 32.0050, 
    cellId: 'CELL-007',
    stationType: '微站',
    type: 'sub', 
    status: 'normal',
    config: {
      hasSmartBoard: true,
      carrier: '4T4R',
      has3CC: true,
      bands: 'n78+n79',
    },
    users: 2678, 
    prb: 70,
    bandwidth: '100+100MHz',
  },
];

// ========== 生成人流线路数据 ==========
function generateFlowLines(currentTime) {
  const hour = parseInt(currentTime?.split(':')[0] || '20');
  
  const lines = [];
  
  TRANSPORT_HUBS.forEach(hub => {
    let flowMultiplier = 1;
    if (hour >= 17 && hour <= 19) flowMultiplier = 1.5;
    else if (hour >= 21 && hour <= 22) flowMultiplier = 1.8;
    else if (hour >= 20 && hour < 21) flowMultiplier = 0.3;
    
    const flow = Math.floor(hub.flow * flowMultiplier * (0.9 + Math.random() * 0.2));
    
    const points = generateCurvePath(
      [hub.lng, hub.lat],
      [OLYMPIC_CENTER.lng, OLYMPIC_CENTER.lat]
    );
    
    lines.push({
      id: `flow_${hub.id}`,
      from: hub.name,
      to: OLYMPIC_CENTER.name,
      flow,
      type: hub.type,
      coords: points,
      weight: Math.min(5, Math.max(1.5, flow / 2500)),
    });
  });
  
  return lines;
}

// ========== 生成曲线路径 ==========
function generateCurvePath(from, to) {
  const midLng = (from[0] + to[0]) / 2;
  const midLat = (from[1] + to[1]) / 2;
  
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  const curveOffset = dist * 0.2;
  const perpX = -dy / dist * curveOffset;
  const perpY = dx / dist * curveOffset;
  
  const controlLng = midLng + perpX;
  const controlLat = midLat + perpY;
  
  const points = [];
  const segments = 40;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const lng = (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * controlLng + t * t * to[0];
    const lat = (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * controlLat + t * t * to[1];
    points.push([lng, lat]);
  }
  
  return points;
}

// ========== 生成枢纽点数据 ==========
function generateHubPoints(currentTime) {
  const hour = parseInt(currentTime?.split(':')[0] || '20');
  
  return TRANSPORT_HUBS.map(hub => {
    let flowMultiplier = 1;
    if (hour >= 17 && hour <= 19) flowMultiplier = 1.5;
    else if (hour >= 21 && hour <= 22) flowMultiplier = 1.8;
    else if (hour >= 20 && hour < 21) flowMultiplier = 0.3;
    
    const flow = Math.floor(hub.flow * flowMultiplier);
    
    return {
      ...hub,
      currentFlow: flow,
      size: Math.min(18, Math.max(8, flow / 600)),
    };
  });
}

// ========== 全局高德安全配置 ==========
if (typeof window !== 'undefined') {
  window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE };
}

// ========== 详情面板组件 ==========
function DetailPanel({ data, onClose }) {
  if (!data) return null;
  
  const isStation = data.id?.startsWith('BS-');
  const isVehicle = data.id?.startsWith('EV-');
  const isHub = data.type === 'metro' || data.type === 'secondary';
  
  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 z-[200] w-80">
      <div className="glass-panel rounded-xl p-4 border border-cyan-400/40 backdrop-blur-md bg-[#0B1A2A]/95">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isStation ? 'bg-cyan-500/30' :
              isVehicle ? 'bg-yellow-500/30' :
              data.type === 'metro' ? 'bg-blue-500/30' :
              'bg-orange-500/30'
            }`}>
              {isStation && <Antenna className="w-4 h-4 text-cyan-400" />}
              {isVehicle && <Radio className="w-4 h-4 text-yellow-400" />}
              {data.type === 'metro' && <Train className="w-4 h-4 text-blue-400" />}
              {data.type === 'secondary' && <Building2 className="w-4 h-4 text-orange-400" />}
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">{data.name}</h3>
              <p className="text-white/50 text-xs">
                {isStation ? '5G 基站' : isVehicle ? '应急通信车' : getTypeLabel(data.type)}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70"
          >
            ×
          </button>
        </div>
        
        {/* 基站/应急车详情 */}
        {(isStation || isVehicle) && (
          <div className="space-y-3">
            {/* 基本信息 */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-cyan-400 text-xs font-medium mb-2">基本信息</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-white/40">小区号码</span>
                  <div className="text-white font-mono">{data.cellId}</div>
                </div>
                <div>
                  <span className="text-white/40">站型</span>
                  <div className="text-white">{data.stationType}</div>
                </div>
              </div>
            </div>
            
            {/* 硬件配置 */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-cyan-400 text-xs font-medium mb-2 flex items-center gap-1">
                <Settings className="w-3 h-3" />
                硬件配置
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-white/40">智能板</span>
                  <span className={data.config.hasSmartBoard ? 'text-green-400' : 'text-white/40'}>
                    {data.config.hasSmartBoard ? '✓ 已接入' : '✗ 未接入'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">载波配置</span>
                  <span className="text-white font-mono">{data.config.carrier}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">3CC 载波聚合</span>
                  <span className={data.config.has3CC ? 'text-green-400' : 'text-white/40'}>
                    {data.config.has3CC ? `✓ ${data.config.bands}` : '✗ 未开启'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">频段</span>
                  <span className="text-white/80 font-mono">{data.config.bands}</span>
                </div>
                {data.bandwidth && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">带宽</span>
                    <span className="text-white/80 font-mono">{data.bandwidth}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* 实时指标 */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-cyan-400 text-xs font-medium mb-2 flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                实时指标
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-white/5 rounded">
                  <div className="text-white/40 text-[10px] mb-1">连接用户</div>
                  <div className="text-cyan-400 font-bold font-mono text-lg">{data.users?.toLocaleString()}</div>
                </div>
                <div className="text-center p-2 bg-white/5 rounded">
                  <div className="text-white/40 text-[10px] mb-1">PRB 利用率</div>
                  <div className={`font-bold font-mono text-lg ${data.prb > 80 ? 'text-red-400' : data.prb > 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {data.prb}%
                  </div>
                </div>
              </div>
              {/* PRB 进度条 */}
              <div className="mt-2">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      data.prb > 80 ? 'bg-red-500' : data.prb > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${data.prb}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* 状态 */}
            <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
              <span className="text-white/60 text-xs">设备状态</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                data.status === 'normal' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {data.status === 'normal' ? '正常运行' : '负载预警'}
              </span>
            </div>
          </div>
        )}
        
        {/* 交通枢纽详情 */}
        {isHub && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-white/60 text-xs">实时人流</span>
              <span className="text-cyan-400 font-bold font-mono text-lg">{data.currentFlow?.toLocaleString()} 人</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-white/60 text-xs">流向</span>
              <span className="text-white/80 text-sm">→ 南京奥体中心</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getTypeLabel(type) {
  const labels = {
    metro: '地铁站',
    secondary: '第二现场',
    destination: '目的地'
  };
  return labels[type] || type;
}

export default function AmapL7Scene({ onStationClick, currentTime = '20:00' }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const layersRef = useRef({});
  
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [flowData, setFlowData] = useState(() => generateFlowLines('20:00'));
  const [hubData, setHubData] = useState(() => generateHubPoints('20:00'));

  useEffect(() => {
    if (sceneRef.current) return;
    
    const container = containerRef.current;
    if (!container) {
      setError('地图容器未找到');
      setLoading(false);
      return;
    }

    if (!AMAP_KEY) {
      setError('高德 Key 未配置');
      setLoading(false);
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

        scene.on('loaded', async () => {
          if (!isEffectActive) {
            if (scene && !scene.destroyed) {
              try { scene.destroy(); } catch (e) {}
            }
            return;
          }
          
          try {
            const lines = generateFlowLines(currentTime);
            const hubs = generateHubPoints(currentTime);
            
            // 1. 虚线人流线路图层
            const flowLineLayer = new LineLayer({ zIndex: 2 })
              .source({
                type: 'FeatureCollection',
                features: lines.map(line => ({
                  type: 'Feature',
                  properties: { flow: line.flow, weight: line.weight },
                  geometry: { type: 'LineString', coordinates: line.coords }
                }))
              }, { parser: { type: 'geojson' } })
              .shape('line')
              .size('weight')
              .color('rgba(0, 240, 255, 0.35)')
              .style({
                opacity: 0.4,
                lineType: 'dash',
                dashArray: [4, 4],
              });
            scene.addLayer(flowLineLayer);
            layersRef.current.flowLines = flowLineLayer;

            // 2. 流动粒子效果层
            const particleData = [];
            lines.forEach(line => {
              for (let i = 0; i < 2; i++) {
                particleData.push({
                  lng: line.coords[0][0],
                  lat: line.coords[0][1],
                  lineCoords: line.coords,
                  offset: i / 2,
                });
              }
            });

            const particleLayer = new PointLayer({ zIndex: 3, blend: 'additive' })
              .source(particleData, { parser: { type: 'json', x: 'lng', y: 'lat' } })
              .shape('circle')
              .size(3)
              .color('rgba(0, 255, 255, 0.8)')
              .style({ opacity: 0.8 })
              .animate({ enable: true, speed: 2, rings: 0 });
            scene.addLayer(particleLayer);
            layersRef.current.flowParticles = particleLayer;

            // 3. 枢纽点图层 - 地铁站和第二现场
            const hubLayer = new PointLayer({ zIndex: 10, pickBuffer: 4 })
              .source({
                type: 'FeatureCollection',
                features: hubs.map(hub => ({
                  type: 'Feature',
                  properties: { ...hub },
                  geometry: { type: 'Point', coordinates: [hub.lng, hub.lat] }
                }))
              }, { parser: { type: 'geojson' } })
              .shape('circle')
              .size('size')
              .color((d) => d.type === 'metro' ? 'rgba(0, 150, 255, 0.6)' : 'rgba(255, 150, 0, 0.6)')
              .style({
                opacity: 0.7,
                stroke: 'rgba(255, 255, 255, 0.8)',
                strokeWidth: 1,
              });
            
            scene.addLayer(hubLayer);
            layersRef.current.hubPoints = hubLayer;

            hubLayer.on('click', (e) => {
              if (e.feature) {
                setSelectedItem(e.feature.properties);
              }
            });

            hubLayer.on('mouseenter', () => {
              if (scene.getMap()) scene.getMap().getCanvas().style.cursor = 'pointer';
            });
            hubLayer.on('mouseleave', () => {
              if (scene.getMap()) scene.getMap().getCanvas().style.cursor = '';
            });

            // 4. 枢纽标签
            const labelLayer = new PointLayer({ zIndex: 11 })
              .source({
                type: 'FeatureCollection',
                features: hubs.map(hub => ({
                  type: 'Feature',
                  properties: { name: hub.name },
                  geometry: { type: 'Point', coordinates: [hub.lng, hub.lat] }
                }))
              }, { parser: { type: 'geojson' } })
              .shape('name', 'text')
              .size(10)
              .color('rgba(255, 255, 255, 0.85)')
              .style({ textAnchor: 'center', textOffset: [0, -25], stroke: '#000', strokeWidth: 2 });
            scene.addLayer(labelLayer);
            layersRef.current.hubLabels = labelLayer;

            // 5. 目的地 - 奥体中心
            const destLayer = new PointLayer({ zIndex: 12 })
              .source({
                type: 'FeatureCollection',
                features: [{
                  type: 'Feature',
                  properties: { name: OLYMPIC_CENTER.name },
                  geometry: { type: 'Point', coordinates: [OLYMPIC_CENTER.lng, OLYMPIC_CENTER.lat] }
                }]
              }, { parser: { type: 'geojson' } })
              .shape('circle')
              .size(28)
              .color('#FFD700')
              .style({ opacity: 0.9, stroke: '#fff', strokeWidth: 2 })
              .animate({ enable: true, speed: 0.5, rings: 3 });
            scene.addLayer(destLayer);
            layersRef.current.destination = destLayer;

            // 目的地标签
            const destLabelLayer = new PointLayer({ zIndex: 13 })
              .source({
                type: 'FeatureCollection',
                features: [{
                  type: 'Feature',
                  properties: { name: OLYMPIC_CENTER.name },
                  geometry: { type: 'Point', coordinates: [OLYMPIC_CENTER.lng, OLYMPIC_CENTER.lat] }
                }]
              }, { parser: { type: 'geojson' } })
              .shape('name', 'text')
              .size(13)
              .color('#FFD700')
              .style({ textAnchor: 'center', textOffset: [0, -40], stroke: '#000', strokeWidth: 3, fontWeight: 'bold' });
            scene.addLayer(destLabelLayer);

            // 6. 应急通信车图层 - 使用 square 并旋转 45度来实现菱形效果
            const vehicleLayer = new PointLayer({ zIndex: 8, pickBuffer: 4 })
              .source({
                type: 'FeatureCollection',
                features: EMERGENCY_VEHICLES.map(v => ({
                  type: 'Feature',
                  properties: { ...v },
                  geometry: { type: 'Point', coordinates: [v.lng, v.lat] }
                }))
              }, { parser: { type: 'geojson' } })
              .shape('square')  // 使用方形
              .size(16)
              .color('#FFA500')
              .style({
                opacity: 0.9,
                stroke: '#fff',
                strokeWidth: 1,
              });
            scene.addLayer(vehicleLayer);
            layersRef.current.vehicles = vehicleLayer;

            vehicleLayer.on('click', (e) => {
              if (e.feature) {
                setSelectedItem(e.feature.properties);
              }
            });
            vehicleLayer.on('mouseenter', () => {
              if (scene.getMap()) scene.getMap().getCanvas().style.cursor = 'pointer';
            });
            vehicleLayer.on('mouseleave', () => {
              if (scene.getMap()) scene.getMap().getCanvas().style.cursor = '';
            });

            // 7. 基站图层 - 使用 simple 形状
            const stationLayer = new PointLayer({ zIndex: 6, pickBuffer: 4 })
              .source({
                type: 'FeatureCollection',
                features: BASE_STATIONS.map(s => ({
                  type: 'Feature',
                  properties: { ...s },
                  geometry: { type: 'Point', coordinates: [s.lng, s.lat] }
                }))
              }, { parser: { type: 'geojson' } })
              .shape('simple')  // 使用 simple 形状
              .size(12)
              .color((d) => d.status === 'warning' ? '#FFAA00' : '#00DDFF')
              .style({
                opacity: 0.85,
                stroke: '#fff',
                strokeWidth: 1,
              });
            
            scene.addLayer(stationLayer);
            layersRef.current.stations = stationLayer;

            stationLayer.on('click', (e) => {
              if (e.feature) {
                setSelectedItem(e.feature.properties);
              }
            });
            stationLayer.on('mouseenter', () => {
              if (scene.getMap()) scene.getMap().getCanvas().style.cursor = 'pointer';
            });
            stationLayer.on('mouseleave', () => {
              if (scene.getMap()) scene.getMap().getCanvas().style.cursor = '';
            });

            // 8. 监控区域图层
            const zoneLayer = new PolygonLayer({ zIndex: 1 })
              .source(EMPTY_GEOJSON, { parser: { type: 'geojson' } })
              .color('rgba(0, 240, 255, 0.05)')
              .shape('extrude')
              .size(15)
              .style({ opacity: 0.2 });
            scene.addLayer(zoneLayer);
            layersRef.current.zone = zoneLayer;

            if (isEffectActive) {
              setSceneLoaded(true);
              setLoading(false);
            }
          } catch (layerErr) {
            console.error('[AmapL7Scene] 图层初始化错误:', layerErr);
            if (isEffectActive) {
              setError('图层初始化失败: ' + layerErr.message);
              setLoading(false);
            }
          }
        });

        scene.on('error', (err) => {
          console.error('[AmapL7Scene] 场景错误:', err);
          if (isEffectActive) {
            setError('地图渲染失败');
            setLoading(false);
          }
        });

      } catch (err) {
        console.error('[AmapL7Scene] 初始化异常:', err);
        if (isEffectActive) {
          setError(err.message || '地图初始化失败');
          setLoading(false);
        }
      }
    };

    initMap();

    return () => {
      isEffectActive = false;
      if (sceneRef.current) {
        try {
          sceneRef.current.destroy();
        } catch (e) {}
        sceneRef.current = null;
      }
    };
  }, []);

  // 更新时间时更新数据
  useEffect(() => {
    if (!sceneLoaded || !sceneRef.current) return;
    
    const newLines = generateFlowLines(currentTime);
    const newHubs = generateHubPoints(currentTime);
    
    setFlowData(newLines);
    setHubData(newHubs);
    
    if (layersRef.current.flowLines) {
      try {
        layersRef.current.flowLines.setData({
          type: 'FeatureCollection',
          features: newLines.map(line => ({
            type: 'Feature',
            properties: { flow: line.flow, weight: line.weight },
            geometry: { type: 'LineString', coordinates: line.coords }
          }))
        });
      } catch (err) {
        console.error('[AmapL7Scene] 更新线路失败:', err);
      }
    }
    
    if (layersRef.current.hubPoints) {
      try {
        layersRef.current.hubPoints.setData({
          type: 'FeatureCollection',
          features: newHubs.map(hub => ({
            type: 'Feature',
            properties: { ...hub },
            geometry: { type: 'Point', coordinates: [hub.lng, hub.lat] }
          }))
        });
      } catch (err) {
        console.error('[AmapL7Scene] 更新枢纽点失败:', err);
      }
    }
  }, [sceneLoaded, currentTime]);

  const totalFlow = flowData.reduce((sum, line) => sum + line.flow, 0);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0B1A2A]">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      
      {(loading || !sceneLoaded) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0B1A2A]/90 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-3" />
            <div className="text-cyan-400 text-lg">初始化人流线路图...</div>
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
      
      <DetailPanel data={selectedItem} onClose={() => setSelectedItem(null)} />
      
      {/* 左上角统计面板 */}
      {sceneLoaded && (
        <div className="absolute top-4 left-4 bg-cyber-panel/90 rounded-xl p-4 border border-cyan-400/30 z-10 min-w-[180px]">
          <div className="flex items-center gap-2 mb-3">
            <Footprints className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-bold">实时人流</span>
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono mb-2">
            {totalFlow.toLocaleString()}
          </div>
          <div className="text-white/40 text-xs">人</div>
        </div>
      )}
      
      {/* 左下角图例 */}
      {sceneLoaded && (
        <div className="absolute bottom-4 left-4 bg-cyber-panel/90 rounded-xl p-4 border border-cyan-400/30 z-10">
          <div className="text-cyan-400 text-sm font-bold mb-3">图例</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-cyan-400/40" style={{ background: 'repeating-linear-gradient(90deg, rgba(0,240,255,0.4) 0, rgba(0,240,255,0.4) 3px, transparent 3px, transparent 6px)' }} />
              <span className="text-white/70">人流流向</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500/60 border border-white/50" />
              <span className="text-white/70">地铁站</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500/60 border border-white/50" />
              <span className="text-white/70">第二现场</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-white/70 font-medium">奥体中心</span>
            </div>
            <div className="h-px bg-white/10 my-1" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 border border-white/50" />
              <span className="text-white/70">应急通信车</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-cyan-400 rotate-45 border border-white/50" />
              <span className="text-white/70">5G 基站</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
