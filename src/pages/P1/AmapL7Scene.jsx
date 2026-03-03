import React, { useEffect, useRef, useState } from 'react';
import { Scene, PointLayer, LineLayer, Popup } from '@antv/l7';
import { GaodeMap } from '@antv/l7-maps';
import { Loader2, Footprints } from 'lucide-react';

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || '';
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE || '';

// ========== 地图配置 ==========
const CAMERA_CONFIG = {
  center: [118.728, 32.005],
  zoom: 14.5,
  pitch: 50,
};

// ========== 奥体中心 ==========
const OLYMPIC_CENTER = { name: '南京奥体中心', lng: 118.7265, lat: 32.0087 };

// ========== 交通枢纽 ==========
const TRANSPORT_HUBS = [
  { id: 'metro_1', name: '奥体东地铁站', lng: 118.7350, lat: 32.0050, type: 'metro', flow: 8500 },
  { id: 'metro_2', name: '元通地铁站', lng: 118.7200, lat: 32.0150, type: 'metro', flow: 6200 },
  { id: 'metro_3', name: '奥体中心地铁站', lng: 118.7240, lat: 32.0100, type: 'metro', flow: 12000 },
  { id: 'venue_1', name: '华彩中心(第二现场)', lng: 118.7400, lat: 32.0120, type: 'secondary', flow: 4500 },
];

// ========== 应急通信车 ==========
const EMERGENCY_VEHICLES = [
  { 
    id: 'EV-001', name: '应急通信车-东', lng: 118.7320, lat: 32.0095, type: 'vehicle',
    cellId: 'CELL-EV-001', stationType: '应急通信车',
    hasSmartBoard: true, carrier: '4T4R', has3CC: true, bands: 'n78+n79',
    users: 1256, prb: 68, status: 'normal'
  },
  { 
    id: 'EV-002', name: '应急通信车-西', lng: 118.7210, lat: 32.0075, type: 'vehicle',
    cellId: 'CELL-EV-002', stationType: '应急通信车',
    hasSmartBoard: true, carrier: '4T4R', has3CC: true, bands: 'n78+n79',
    users: 987, prb: 52, status: 'normal'
  },
];

// ========== 基站数据 ==========
const BASE_STATIONS = [
  { id: 'BS-001', name: '奥体主站-北', lng: 118.7265, lat: 32.0130, type: 'station',
    cellId: 'CELL-001', stationType: '宏站', status: 'normal',
    hasSmartBoard: true, carrier: '64T64R', has3CC: true, bands: 'n28+n78+n79',
    users: 2847, prb: 72 },
  { id: 'BS-002', name: '奥体主站-南', lng: 118.7265, lat: 32.0045, type: 'station',
    cellId: 'CELL-002', stationType: '宏站', status: 'normal',
    hasSmartBoard: true, carrier: '64T64R', has3CC: true, bands: 'n28+n78+n79',
    users: 2156, prb: 65 },
  { id: 'BS-003', name: '奥体主站-东', lng: 118.7320, lat: 32.0087, type: 'station',
    cellId: 'CELL-003', stationType: '宏站', status: 'warning',
    hasSmartBoard: false, carrier: '32T32R', has3CC: false, bands: 'n78',
    users: 3124, prb: 88 },
  { id: 'BS-004', name: '奥体主站-西', lng: 118.7210, lat: 32.0087, type: 'station',
    cellId: 'CELL-004', stationType: '宏站', status: 'normal',
    hasSmartBoard: false, carrier: '32T32R', has3CC: false, bands: 'n78',
    users: 1832, prb: 52 },
  { id: 'BS-005', name: '华彩中心站', lng: 118.7400, lat: 32.0120, type: 'station',
    cellId: 'CELL-005', stationType: '微站', status: 'normal',
    hasSmartBoard: true, carrier: '4T4R', has3CC: true, bands: 'n78+n79',
    users: 4521, prb: 85 },
  { id: 'BS-006', name: '元通枢纽站', lng: 118.7200, lat: 32.0150, type: 'station',
    cellId: 'CELL-006', stationType: '微站', status: 'normal',
    hasSmartBoard: false, carrier: '4T4R', has3CC: false, bands: 'n78',
    users: 1987, prb: 58 },
  { id: 'BS-007', name: '奥体东站', lng: 118.7350, lat: 32.0050, type: 'station',
    cellId: 'CELL-007', stationType: '微站', status: 'normal',
    hasSmartBoard: true, carrier: '4T4R', has3CC: true, bands: 'n78+n79',
    users: 2678, prb: 70 },
];

// ========== Base64 图标 ==========
// 青色菱形基站图标
const STATION_ICON = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMEw0MCAyMEwyMCA0MEwwIDIwTDIwIDBaIiBmaWxsPSIjMDBERkZGIi8+PHBhdGggZD0iTTIwIDVMMzUgMjBMMjAgMzVMNSAyMEwyMCA1WiIgZmlsbD0iIzAwRkZGRiIvPjwvc3ZnPg==';
// 橙色方形应急车图标
const VEHICLE_ICON = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSI1IiB5PSI4IiB3aWR0aD0iMzAiIGhlaWdodD0iMjQiIHJ4PSI0IiBmaWxsPSIjRkZBNTAwIi8+PHJlY3QgeD0iMTAiIHk9IjEyIiB3aWR0aD0iMjAiIGhlaWdodD0iMTYiIHJ4PSIyIiBmaWxsPSIjRkZDQzAwIi8+PGNpcmNsZSBjeD0iMTIiIGN5PSIzMiIgcj0iNCIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjI4IiBjeT0iMzIiIHI9IjQiIGZpbGw9IiNmZmYiLz48L3N2Zz4=';
// 金色奥体中心图标
const CENTER_ICON = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyMCIgZmlsbD0iI0ZGRDcwMCIvPjxjaXJjbGUgY3g9IjI0IiBjeT0iMjQiIHI9IjE0IiBmaWxsPSIjRkZBMzAwIi8+PC9zdmc+';

// ========== 全局安全配置 ==========
if (typeof window !== 'undefined') {
  window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE };
}

// ========== 生成人流线路 ==========
function generateFlowLines(currentTime) {
  const hour = parseInt(currentTime?.split(':')[0] || '20');
  let flowMultiplier = 1;
  if (hour >= 17 && hour <= 19) flowMultiplier = 1.5;
  else if (hour >= 21 && hour <= 22) flowMultiplier = 1.8;
  else if (hour >= 20 && hour < 21) flowMultiplier = 0.3;
  
  return TRANSPORT_HUBS.map(hub => {
    const flow = Math.floor(hub.flow * flowMultiplier);
    const midLng = (hub.lng + OLYMPIC_CENTER.lng) / 2;
    const midLat = (hub.lat + OLYMPIC_CENTER.lat) / 2;
    const dx = OLYMPIC_CENTER.lng - hub.lng;
    const dy = OLYMPIC_CENTER.lat - hub.lat;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curveOffset = dist * 0.2;
    const perpX = -dy / dist * curveOffset;
    const perpY = dx / dist * curveOffset;
    const controlLng = midLng + perpX;
    const controlLat = midLat + perpY;
    
    const points = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const lng = (1-t)*(1-t)*hub.lng + 2*(1-t)*t*controlLng + t*t*OLYMPIC_CENTER.lng;
      const lat = (1-t)*(1-t)*hub.lat + 2*(1-t)*t*controlLat + t*t*OLYMPIC_CENTER.lat;
      points.push([lng, lat]);
    }
    
    return { ...hub, flow, coords: points, weight: Math.min(5, Math.max(1.5, flow / 2500)) };
  });
}

// ========== 生成弹窗HTML ==========
function generatePopupHtml(data) {
  const isStation = data.type === 'station';
  const isVehicle = data.type === 'vehicle';
  const themeColor = isStation ? '#00f0ff' : isVehicle ? '#ff9900' : '#0096ff';
  const icon = isStation ? '📡' : isVehicle ? '🚐' : '📍';
  const prbColor = data.prb > 80 ? '#ff4d4f' : data.prb > 60 ? '#faad14' : '#00ff00';
  
  return `
    <div style="background: rgba(11, 26, 42, 0.95); border: 1px solid ${themeColor}; padding: 16px; border-radius: 8px; color: #fff; width: 280px; box-shadow: 0 0 20px rgba(${isStation ? '0, 240, 255' : isVehicle ? '255, 153, 0' : '0, 150, 255'}, 0.4); font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
      <h4 style="margin: 0 0 12px 0; color: ${themeColor}; font-size: 15px; border-bottom: 1px solid ${themeColor}40; padding-bottom: 8px; font-weight: 600;">${icon} ${data.name}</h4>
      
      ${(isStation || isVehicle) ? `
      <div style="font-size: 12px; line-height: 2;">
        <div style="display: flex; justify-content: space-between;"><span style="color: rgba(255,255,255,0.6);">小区号码:</span> <span style="color: #fff; font-family: monospace;">${data.cellId}</span></div>
        <div style="display: flex; justify-content: space-between;"><span style="color: rgba(255,255,255,0.6);">站型:</span> <span style="color: #fff;">${data.stationType}</span></div>
        
        <div style="margin: 10px 0; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
          <div style="color: ${themeColor}; font-size: 11px; margin-bottom: 6px; font-weight: 500;">硬件配置</div>
          <div style="display: flex; justify-content: space-between;"><span style="color: rgba(255,255,255,0.6);">智能板:</span> <span style="color: ${data.hasSmartBoard ? '#00ff00' : '#ff4d4f'}; font-weight: 500;">${data.hasSmartBoard ? '✓ 已接入' : '✗ 未接入'}</span></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: rgba(255,255,255,0.6);">载波配置:</span> <span style="color: #fff; font-family: monospace;">${data.carrier}</span></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: rgba(255,255,255,0.6);">3CC载波:</span> <span style="color: ${data.has3CC ? '#00ff00' : '#888'}; font-weight: 500;">${data.has3CC ? `✓ ${data.bands}` : '✗ 未开启'}</span></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: rgba(255,255,255,0.6);">频段:</span> <span style="color: #fff; font-family: monospace;">${data.bands}</span></div>
        </div>
        
        <div style="margin: 10px 0; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
          <div style="color: ${themeColor}; font-size: 11px; margin-bottom: 6px; font-weight: 500;">实时指标</div>
          <div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: rgba(255,255,255,0.6);">连接用户:</span> <span style="color: ${themeColor}; font-weight: bold; font-size: 14px;">${data.users.toLocaleString()} 人</span></div>
          <div style="margin-top: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;"><span style="color: rgba(255,255,255,0.6);">PRB利用率:</span> <span style="color: ${prbColor}; font-weight: bold; font-size: 14px;">${data.prb}%</span></div>
            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;"><div style="width: ${data.prb}%; height: 100%; background: ${prbColor}; border-radius: 3px;"></div></div>
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);"><span style="color: rgba(255,255,255,0.6);">设备状态:</span> <span style="color: ${data.status === 'normal' ? '#00ff00' : '#ff4d4f'}; font-weight: 500;">${data.status === 'normal' ? '正常运行' : '负载预警'}</span></div>
      </div>
      ` : `
      <div style="font-size: 12px; line-height: 1.8;">
        <div style="display: flex; justify-content: space-between;"><span style="color: rgba(255,255,255,0.6);">实时人流:</span> <span style="color: #00f0ff; font-weight: bold;">${data.flow?.toLocaleString()} 人</span></div>
        <div style="display: flex; justify-content: space-between;"><span style="color: rgba(255,255,255,0.6);">流向:</span> <span style="color: #fff;">→ 奥体中心</span></div>
      </div>
      `}
    </div>
  `;
}

export default function AmapL7Scene({ currentTime = '20:00' }) {
  const mapContainerRef = useRef(null);
  const sceneRef = useRef(null);
  const popupRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [totalFlow, setTotalFlow] = useState(0);

  useEffect(() => {
    if (sceneRef.current || !mapContainerRef.current) return;

    const scene = new Scene({
      id: mapContainerRef.current,
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
      try {
        // 1. 加载自定义图标
        await Promise.all([
          scene.addImage('station', STATION_ICON),
          scene.addImage('vehicle', VEHICLE_ICON),
          scene.addImage('center', CENTER_ICON),
        ]);

        const flowLines = generateFlowLines(currentTime);
        setTotalFlow(flowLines.reduce((sum, line) => sum + line.flow, 0));

        // 2. 人流虚线图层
        const flowLayer = new LineLayer({ zIndex: 2 })
          .source({
            type: 'FeatureCollection',
            features: flowLines.map(line => ({
              type: 'Feature',
              properties: { weight: line.weight },
              geometry: { type: 'LineString', coordinates: line.coords }
            }))
          }, { parser: { type: 'geojson' } })
          .shape('line')
          .size('weight')
          .color('rgba(0, 240, 255, 0.35)')
          .style({ opacity: 0.4, lineType: 'dash', dashArray: [4, 4] });
        scene.addLayer(flowLayer);

        // 3. 流动粒子
        const particleData = [];
        flowLines.forEach(line => {
          for (let i = 0; i < 2; i++) {
            particleData.push({ lng: line.coords[0][0], lat: line.coords[0][1], lineCoords: line.coords, offset: i / 2 });
          }
        });
        const particleLayer = new PointLayer({ zIndex: 3, blend: 'additive' })
          .source(particleData, { parser: { type: 'json', x: 'lng', y: 'lat' } })
          .shape('circle').size(3).color('rgba(0, 255, 255, 0.8)')
          .style({ opacity: 0.8 })
          .animate({ enable: true, speed: 2, rings: 0 });
        scene.addLayer(particleLayer);

        // 4. 枢纽点（地铁站+第二现场）
        const hubData = flowLines.map(line => ({
          ...line,
          size: Math.min(18, Math.max(8, line.flow / 600)),
        }));

        // 枢纽呼吸灯层
        const hubBreathingLayer = new PointLayer({ zIndex: 9 })
          .source(hubData, { parser: { type: 'json', x: 'lng', y: 'lat' } })
          .shape('circle').size(35)
          .color('type', t => t === 'metro' ? '#0096ff' : '#ff9900')
          .animate({ enable: true, speed: 0.03, rings: 3 })
          .style({ opacity: 0.4 });
        scene.addLayer(hubBreathingLayer);

        // 枢纽实体层
        const hubLayer = new PointLayer({ zIndex: 10, pickBuffer: 4 })
          .source(hubData, { parser: { type: 'json', x: 'lng', y: 'lat' } })
          .shape('circle').size('size')
          .color('type', t => t === 'metro' ? 'rgba(0, 150, 255, 0.7)' : 'rgba(255, 150, 0, 0.7)')
          .style({ opacity: 0.8, stroke: 'rgba(255,255,255,0.8)', strokeWidth: 1.5 });
        scene.addLayer(hubLayer);

        hubLayer.on('click', (e) => {
          if (e.feature && e.lngLat) {
            if (popupRef.current) popupRef.current.remove();
            const popup = new Popup({ offsets: [0, -20], closeButton: false })
              .setLnglat(e.lngLat)
              .setHTML(generatePopupHtml(e.feature));
            scene.addPopup(popup);
            popupRef.current = popup;
          }
        });
        hubLayer.on('mouseenter', () => { if (scene.getMap()) scene.getMap().getCanvas().style.cursor = 'pointer'; });
        hubLayer.on('mouseleave', () => { if (scene.getMap()) scene.getMap().getCanvas().style.cursor = ''; });

        // 枢纽标签
        const hubLabelLayer = new PointLayer({ zIndex: 11 })
          .source(hubData, { parser: { type: 'json', x: 'lng', y: 'lat' } })
          .shape('name', 'text').size(10).color('rgba(255, 255, 255, 0.85)')
          .style({ textAnchor: 'center', textOffset: [0, -25], stroke: '#000', strokeWidth: 2 });
        scene.addLayer(hubLabelLayer);

        // 5. 奥体中心
        const centerBreathingLayer = new PointLayer({ zIndex: 12 })
          .source([OLYMPIC_CENTER], { parser: { type: 'json', x: 'lng', y: 'lat' } })
          .shape('circle').size(50).color('#FFD700')
          .animate({ enable: true, speed: 0.02, rings: 3 })
          .style({ opacity: 0.5 });
        scene.addLayer(centerBreathingLayer);

        const centerLayer = new PointLayer({ zIndex: 13 })
          .source([OLYMPIC_CENTER], { parser: { type: 'json', x: 'lng', y: 'lat' } })
          .shape('center').size(28);
        scene.addLayer(centerLayer);

        const centerLabelLayer = new PointLayer({ zIndex: 14 })
          .source([OLYMPIC_CENTER], { parser: { type: 'json', x: 'lng', y: 'lat' } })
          .shape('name', 'text').size(13).color('#FFD700')
          .style({ textAnchor: 'center', textOffset: [0, -40], stroke: '#000', strokeWidth: 3, fontWeight: 'bold' });
        scene.addLayer(centerLabelLayer);

        // 6. 应急通信车
        const vehicleBreathingLayer = new PointLayer({ zIndex: 7 })
          .source(EMERGENCY_VEHICLES, { parser: { type: 'json', x: 'lng', y: 'lat' } })
          .shape('circle').size(35).color('#ff9900')
          .animate({ enable: true, speed: 0.03, rings: 3 })
          .style({ opacity: 0.4 });
        scene.addLayer(vehicleBreathingLayer);

        const vehicleLayer = new PointLayer({ zIndex: 8, pickBuffer: 4 })
          .source(EMERGENCY_VEHICLES, { parser: { type: 'json', x: 'lng', y: 'lat' } })
          .shape('vehicle').size(22);
        scene.addLayer(vehicleLayer);

        vehicleLayer.on('click', (e) => {
          if (e.feature && e.lngLat) {
            if (popupRef.current) popupRef.current.remove();
            const popup = new Popup({ offsets: [0, -20], closeButton: false })
              .setLnglat(e.lngLat)
              .setHTML(generatePopupHtml(e.feature));
            scene.addPopup(popup);
            popupRef.current = popup;
          }
        });
        vehicleLayer.on('mouseenter', () => { if (scene.getMap()) scene.getMap().getCanvas().style.cursor = 'pointer'; });
        vehicleLayer.on('mouseleave', () => { if (scene.getMap()) scene.getMap().getCanvas().style.cursor = ''; });

        // 7. 基站
        const stationBreathingLayer = new PointLayer({ zIndex: 5 })
          .source(BASE_STATIONS, { parser: { type: 'json', x: 'lng', y: 'lat' } })
          .shape('circle').size(30)
          .color('status', s => s === 'warning' ? '#ffaa00' : '#00ddff')
          .animate({ enable: true, speed: 0.03, rings: 3 })
          .style({ opacity: 0.3 });
        scene.addLayer(stationBreathingLayer);

        const stationLayer = new PointLayer({ zIndex: 6, pickBuffer: 4 })
          .source(BASE_STATIONS, { parser: { type: 'json', x: 'lng', y: 'lat' } })
          .shape('station').size(16);
        scene.addLayer(stationLayer);

        stationLayer.on('click', (e) => {
          if (e.feature && e.lngLat) {
            if (popupRef.current) popupRef.current.remove();
            const popup = new Popup({ offsets: [0, -20], closeButton: false })
              .setLnglat(e.lngLat)
              .setHTML(generatePopupHtml(e.feature));
            scene.addPopup(popup);
            popupRef.current = popup;
          }
        });
        stationLayer.on('mouseenter', () => { if (scene.getMap()) scene.getMap().getCanvas().style.cursor = 'pointer'; });
        stationLayer.on('mouseleave', () => { if (scene.getMap()) scene.getMap().getCanvas().style.cursor = ''; });

        setLoading(false);
        setSceneLoaded(true);
      } catch (err) {
        console.error('[AmapL7Scene] 初始化错误:', err);
        setError(err.message);
        setLoading(false);
      }
    });

    scene.on('error', (err) => {
      console.error('[AmapL7Scene] 场景错误:', err);
      setError('地图渲染失败');
      setLoading(false);
    });

    return () => {
      if (popupRef.current) popupRef.current.remove();
      if (sceneRef.current) {
        sceneRef.current.destroy();
        sceneRef.current = null;
      }
    };
  }, []);

  // 时间变化时更新
  useEffect(() => {
    if (!sceneLoaded || !sceneRef.current) return;
    const flowLines = generateFlowLines(currentTime);
    setTotalFlow(flowLines.reduce((sum, line) => sum + line.flow, 0));
  }, [sceneLoaded, currentTime]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0B1A2A]">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0B1A2A]/90 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-3" />
            <div className="text-cyan-400 text-lg">初始化地图...</div>
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
      
      {sceneLoaded && (
        <>
          <div className="absolute top-4 left-4 bg-cyber-panel/90 rounded-xl p-4 border border-cyan-400/30 z-10 min-w-[180px]">
            <div className="flex items-center gap-2 mb-3">
              <Footprints className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-bold">实时人流</span>
            </div>
            <div className="text-2xl font-bold text-cyan-400 font-mono">{totalFlow.toLocaleString()}</div>
            <div className="text-white/40 text-xs">人</div>
          </div>
          
          <div className="absolute bottom-4 left-4 bg-cyber-panel/90 rounded-xl p-4 border border-cyan-400/30 z-10">
            <div className="text-cyan-400 text-sm font-bold mb-3">图例</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5" style={{ background: 'repeating-linear-gradient(90deg, rgba(0,240,255,0.4) 0, rgba(0,240,255,0.4) 3px, transparent 3px, transparent 6px)' }} />
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
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-white/70 font-medium">奥体中心</span>
              </div>
              <div className="h-px bg-white/10 my-1" />
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 bg-orange-500 rounded-sm" />
                <span className="text-white/70">应急通信车</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 transform rotate-45 bg-cyan-400" />
                <span className="text-white/70">5G 基站</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
