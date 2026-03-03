/**
 * P1 右侧面板 V2 - 基于 V2 数据契约
 * 核心改进：
 * 1. 使用 Store V2 计算指标数据
 * 2. 环比变化自动计算 (前端 ratio = rrc_users / baseline_rrc_users)
 * 3. 统一使用 V2 字段 (metric_val, baseline_val, mom_change)
 */

import { useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Activity, AlertTriangle, AlertCircle, Info, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore.js';

// 迷你趋势图组件
function MiniTrendChart({ data, color }) {
  const option = {
    grid: { top: 2, right: 2, bottom: 2, left: 2 },
    xAxis: { type: 'category', show: false, data: ['', '', '', '', '', '', ''] },
    yAxis: { type: 'value', show: false, min: 0 },
    series: [{
      type: 'line',
      data: data || [0, 0, 0, 0, 0, 0, 0],
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2, color },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: color + '40' },
            { offset: 1, color: color + '00' }
          ]
        }
      }
    }]
  };
  return <ReactECharts option={option} style={{ height: 32, width: '100%' }} />;
}

// 告警卡片组件
function AlarmCard({ alarm }) {
  const levelColors = {
    high: 'border-red-500/50 bg-red-500/10',
    medium: 'border-yellow-500/50 bg-yellow-500/10',
    low: 'border-cyan-500/30 bg-cyan-500/10',
    info: 'border-white/20 bg-white/5',
  };
  
  const levelIcons = {
    high: <AlertTriangle className="w-4 h-4 text-red-400" />,
    medium: <AlertCircle className="w-4 h-4 text-yellow-400" />,
    low: <Info className="w-4 h-4 text-cyan-400" />,
    info: <Info className="w-4 h-4 text-white/50" />,
  };

  // V2: 通过 cell_id 关联
  const hasLocation = !!alarm.cell_id;
  
  return (
    <div className={`p-3 rounded-lg border ${levelColors[alarm.alert_level || alarm.level]} mb-2`}>
      <div className="flex items-start gap-2">
        {levelIcons[alarm.alert_level || alarm.level]}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium truncate">{alarm.title}</span>
            {hasLocation && (
              <span className="text-[10px] text-cyan-400/70 bg-cyan-400/10 px-1.5 py-0.5 rounded">
                {alarm.cell_id}
              </span>
            )}
          </div>
          <p className="text-white/60 text-xs mt-1">{alarm.description || alarm.detail}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-white/40 text-[10px]">
              {new Date(alarm.timestamp || Date.now()).toLocaleTimeString()}
            </span>
            {alarm.alert_type && (
              <span className="text-[10px] text-white/30 bg-white/10 px-1.5 rounded">
                {alarm.alert_type}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RightPanelP1V2() {
  // V2 Store 集成
  const { 
    getComputedKQI, 
    alertEventStream,
    fetchV2RealtimeData,
  } = useDashboardStore();

  const kqiData = getComputedKQI();
  
  // 格式化 KQI 数据
  const formattedKQI = useMemo(() => {
    return kqiData.map(item => ({
      label: item.metric_name,
      value: item.metric_val.toLocaleString(),
      unit: item.unit,
      trend: item.mom_change, // V2: 使用计算出的环比
      isPositiveTrend: item.is_positive_trend,
      trendData: [item.baseline_val * 0.9, item.baseline_val * 0.95, item.baseline_val, item.metric_val * 0.95, item.metric_val],
    }));
  }, [kqiData]);

  // 默认 KQI 数据 (加载前显示)
  const defaultKQI = [
    { label: '总流量', value: '8,420', unit: 'GB', trend: '+12%', isPositiveTrend: true, trendData: [6500, 7200, 6800, 7500, 8200, 7900, 8420] },
    { label: '语音话务量', value: '420', unit: 'Erl', trend: '+5%', isPositiveTrend: true, trendData: [380, 390, 400, 395, 410, 415, 420] },
    { label: '平均吞吐', value: '520', unit: 'Mbps', trend: '-2%', isPositiveTrend: false, trendData: [480, 510, 530, 545, 535, 528, 520] },
    { label: '时延', value: '12', unit: 'ms', trend: '-8%', isPositiveTrend: true, trendData: [18, 16, 15, 14, 13, 12.5, 12] },
  ];

  const displayKQI = formattedKQI.length > 0 ? formattedKQI : defaultKQI;

  // 定时刷新数据
  useEffect(() => {
    fetchV2RealtimeData();
    const interval = setInterval(fetchV2RealtimeData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-[320px] h-full flex flex-col gap-3 p-4 z-10 overflow-y-auto pb-32">
      {/* KQI 业务指标 - V2 */}
      <div className="glass-panel rounded-xl p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-bold text-sm">KQI 业务指标 (V2)</span>
          </div>
          <span className="text-[10px] text-white/40">实时计算</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {displayKQI.map((item, index) => (
            <div key={index} className="bg-white/5 p-3 rounded-lg">
              <div className="text-white/50 text-xs mb-1">{item.label}</div>
              <div className="text-white font-bold text-lg">
                {item.value} <span className="text-xs text-white/60">{item.unit}</span>
              </div>
              <div className={`flex items-center gap-1 text-xs ${item.isPositiveTrend ? 'text-green-400' : 'text-red-400'}`}>
                {item.isPositiveTrend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {item.trend}
              </div>
              <MiniTrendChart 
                data={item.trendData} 
                color={item.label === '时延' ? '#FF6B6B' : '#00F0FF'} 
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* 智能体告警监测 - V2 */}
      <div className="glass-panel rounded-xl p-4 flex-1 min-h-0 flex-shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-bold text-sm">智能体告警监测 (V2)</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-white/40">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            实时
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 min-h-0">
          {alertEventStream.length > 0 ? (
            alertEventStream.map((alarm, index) => (
              <AlarmCard key={alarm.alert_id || index} alarm={alarm} />
            ))
          ) : (
            // 默认告警数据
            <>
              <AlarmCard alarm={{ 
                alert_id: 'alt_001', alert_level: 'high', alert_type: 'congestion', cell_id: 'cell_005',
                title: '华彩中心拥塞告警', description: 'PRB利用率超过85%', timestamp: Date.now() - 120000 
              }} />
              <AlarmCard alarm={{ 
                alert_id: 'alt_002', alert_level: 'medium', alert_type: 'capacity', cell_id: 'cell_003',
                title: '奥体东站容量预警', description: 'RRC连接数接近上限', timestamp: Date.now() - 300000 
              }} />
              <AlarmCard alarm={{ 
                alert_id: 'alt_003', alert_level: 'high', alert_type: 'interference', cell_id: 'cell_001',
                title: '奥体主站干扰告警', description: '上行干扰噪声抬升', timestamp: Date.now() - 600000 
              }} />
            </>
          )}
        </div>
        
        {/* 底部操作 */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-white/40 text-xs">{alertEventStream.length} 个活跃告警</span>
          <button className="flex items-center gap-1 text-cyan-400 text-xs hover:text-cyan-300">
            查看全部 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
