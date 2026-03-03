/**
 * P1 左侧面板 V2 - 基于 V2 数据契约
 * 核心改进：
 * 1. 使用 Store V2 计算指标数据
 * 2. PRB 负载监控展示 pressure_ratio 计算结果
 * 3. 统一使用 V2 字段 (cell_id, rrc_users, baseline_rrc_users)
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { Radio, Cpu, Wifi, Car, Terminal, Activity, TrendingUp, Users } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore.js';

// PRB 负载条组件
function PrbBar({ label, value, ratio }) {
  const getColor = (v) => {
    if (v > 70) return 'bg-red-400';
    if (v > 50) return 'bg-yellow-400';
    return 'bg-gradient-to-r from-cyan-400 to-green-400';
  };
  
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-white/60 text-xs w-28 truncate">{label}</span>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          style={{ width: `${Math.min(value, 100)}%` }} 
          className={`h-full rounded-full transition-all duration-500 ${getColor(value)}`}
        />
      </div>
      <div className="flex flex-col items-end">
        <span className={`text-xs font-bold ${value > 70 ? 'text-red-400' : value > 50 ? 'text-yellow-400' : 'text-white'}`}>
          {value}%
        </span>
        {ratio > 0 && (
          <span className="text-[9px] text-white/40">ratio: {ratio}x</span>
        )}
      </div>
    </div>
  );
}

// 资源指标卡片
function ResourceCard({ icon: Icon, label, value, subtext, color = 'cyan' }) {
  const colorClasses = {
    cyan: 'from-cyan-500/30 to-blue-600/30 border-cyan-400/30 text-cyan-400',
    purple: 'from-purple-500/30 to-pink-600/30 border-purple-400/30 text-purple-400',
    green: 'from-green-500/30 to-emerald-600/30 border-green-400/30 text-green-400',
    orange: 'from-orange-500/30 to-red-600/30 border-orange-400/30 text-orange-400',
  };
  
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg p-3 border`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-white/70 text-xs">{label}</span>
      </div>
      <div className="text-white font-bold text-xl">{value}</div>
      {subtext && <div className="text-[10px] text-white/50 mt-1">{subtext}</div>}
    </div>
  );
}

// 日志条目组件
function LogEntry({ log }) {
  const typeColors = {
    success: 'text-green-400',
    warn: 'text-yellow-400',
    alert: 'text-red-400',
    ai: 'text-purple-400',
    info: 'text-cyan-400',
  };
  
  return (
    <div className="flex gap-2 py-0.5">
      <span className="text-white/30 text-[10px] shrink-0">{log.time}</span>
      <span className={`text-xs ${typeColors[log.type] || 'text-white/60'}`}>{log.content}</span>
    </div>
  );
}

export default function LeftPanelP1V2() {
  const logContainerRef = useRef(null);
  
  // V2 Store 集成
  const { 
    getComputedCellPerf, 
    getComputedHubPressure,
    fetchV2RealtimeData,
  } = useDashboardStore();

  const cellPerfData = getComputedCellPerf();
  const hubPressureData = getComputedHubPressure();
  
  // 定时刷新数据
  useEffect(() => {
    fetchV2RealtimeData();
    const interval = setInterval(fetchV2RealtimeData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 模拟日志数据
  const [logs, setLogs] = useState([
    { time: '19:42:19', type: 'success', content: '切换已恢复 时延+3ms' },
    { time: '19:42:25', type: 'info', content: '流量模式分析中...' },
    { time: '19:42:26', type: 'warn', content: '北广场拥塞指数上升' },
    { time: '19:42:27', type: 'ai', content: '预测性负载均衡启动' },
    { time: '19:42:28', type: 'ai', content: '激活应急波束' },
    { time: '19:42:29', type: 'success', content: '负载已分配 QoS稳定' },
    { time: '19:42:33', type: 'info', content: '小区04 PRB负载激增' },
    { time: '19:42:34', type: 'alert', content: '检测到光纤衰耗(eOTDR)' },
    { time: '19:42:36', type: 'success', content: '自愈运行中 场景: 1/3' },
    { time: '19:42:38', type: 'ai', content: '智能板协同调度完成' },
    { time: '19:42:40', type: 'info', content: '5G-A 载波聚合正常' },
    { time: '19:42:42', type: 'warn', content: '元通站流量预警' },
  ]);

  // 日志自动滚动
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // 获取热点场景的 PRB 数据 (取 top 4)
  const hotSpots = useMemo(() => {
    if (cellPerfData.length === 0) {
      // 默认数据
      return [
        { label: '元通地铁入口', prb_util: 78, ratio: 2.37 },
        { label: '南看台 F区', prb_util: 62, ratio: 1.73 },
        { label: '奥体北门检票口', prb_util: 45, ratio: 1.42 },
        { label: '内场VIP区', prb_util: 38, ratio: 1.28 },
      ];
    }
    return cellPerfData
      .sort((a, b) => b.prb_util - a.prb_util)
      .slice(0, 4)
      .map(cell => ({
        label: cell.cell_name,
        prb_util: cell.prb_util,
        ratio: cell.pressure_ratio,
      }));
  }, [cellPerfData]);

  // 计算总资源统计
  const resourceStats = useMemo(() => {
    const totalStations = 48;
    const onlineStations = cellPerfData.length || 8;
    const totalUsers = cellPerfData.reduce((sum, c) => sum + (c.rrc_users || 0), 0);
    const avgPrb = cellPerfData.length > 0 
      ? Math.round(cellPerfData.reduce((sum, c) => sum + (c.prb_util || 0), 0) / cellPerfData.length)
      : 42;
    
    return { totalStations, onlineStations, totalUsers, avgPrb };
  }, [cellPerfData]);

  return (
    <div className="w-[320px] h-full flex flex-col gap-3 p-4 z-10 overflow-y-auto pb-32">
      {/* 5G-A 资源与韧性 - V2 */}
      <div className="glass-panel rounded-xl p-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-4 h-4 text-cyan-400" />
          <span className="text-white font-bold text-sm">5G-A 资源与韧性 (V2)</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <ResourceCard 
            icon={Wifi} 
            label="5G站点" 
            value={`${resourceStats.totalStations}`}
            subtext={`在线 ${resourceStats.onlineStations}`}
            color="cyan"
          />
          <ResourceCard 
            icon={Cpu} 
            label="智能板" 
            value="6"
            subtext="100% 激活"
            color="purple"
          />
          <ResourceCard 
            icon={Activity} 
            label="3CC载波" 
            value="48"
            subtext={`平均PRB ${resourceStats.avgPrb}%`}
            color="green"
          />
          <ResourceCard 
            icon={Car} 
            label="应急车" 
            value="2"
            subtext="东西停车场"
            color="orange"
          />
        </div>
        
        {/* 实时用户数统计 */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-white/60 text-xs">实时RRC连接</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{resourceStats.totalUsers.toLocaleString()}</span>
            <TrendingUp className="w-3 h-3 text-green-400" />
          </div>
        </div>
      </div>
      
      {/* PRB 负载监控 - V2 (热点场景) */}
      <div className="glass-panel rounded-xl p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-bold text-sm">PRB 负载监控 (V2)</span>
          </div>
          <span className="text-[10px] text-white/40">ratio = rrc/baseline</span>
        </div>
        
        <div className="space-y-1">
          {hotSpots.map((spot, index) => (
            <PrbBar 
              key={index}
              label={spot.label}
              value={spot.prb_util}
              ratio={spot.ratio}
            />
          ))}
        </div>
        
        {/* 图例 */}
        <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-4 text-[10px] text-white/40">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span>&lt;50%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span>50-70%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span>&gt;70%</span>
          </div>
        </div>
      </div>
      
      {/* 智能运维终端 - V2 */}
      <div className="glass-panel rounded-xl p-4 flex-1 flex flex-col min-h-0 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-green-400" />
          <span className="text-white font-bold text-sm">智能运维终端 (V2)</span>
        </div>
        
        <div 
          ref={logContainerRef}
          className="flex-1 overflow-hidden font-mono"
        >
          {logs.map((log, index) => (
            <LogEntry key={index} log={log} />
          ))}
        </div>
      </div>
    </div>
  );
}
