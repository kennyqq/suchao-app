/**
 * P2 右侧面板 V2 - 基于 V2 数据契约
 * 核心改进：
 * 1. 使用 Store V2 Zone 数据获取 top_devices_json
 * 2. 显示 5G-A 渗透率
 * 3. 终端分析动态加载
 */

import { motion } from 'framer-motion';
import { Wifi, Shield, AlertTriangle, ChevronRight, Smartphone, TrendingUp } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import useDashboardStore from '../../store/useDashboardStore.js';

// ========== 模块一：分层分级体验（雷达图）==========
function RadarExperience() {
  const option = {
    legend: {
      data: ['VIP用户', '普通用户'],
      top: 0,
      left: 'center',
      textStyle: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 10 },
      itemWidth: 10,
      itemHeight: 10,
    },
    radar: {
      indicator: [
        { name: '下行速率', max: 1000 },
        { name: '语音清晰', max: 100 },
        { name: '视频卡顿', max: 100 },
        { name: '直播上行', max: 100 },
        { name: '低时延', max: 100 },
      ],
      center: ['50%', '55%'],
      radius: '55%',
      splitNumber: 4,
      axisName: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 9 },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
      splitArea: {
        show: true,
        areaStyle: { color: ['rgba(0, 240, 255, 0.02)', 'rgba(0, 240, 255, 0.05)'] },
      },
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: [850, 95, 98, 100, 95],
          name: 'VIP用户',
          lineStyle: { color: '#FFD700', width: 2 },
          areaStyle: { color: 'rgba(255, 215, 0, 0.2)' },
          itemStyle: { color: '#FFD700' },
          symbol: 'circle',
          symbolSize: 4,
        },
        {
          value: [400, 80, 75, 85, 70],
          name: '普通用户',
          lineStyle: { color: '#00F0FF', width: 2 },
          areaStyle: { color: 'rgba(0, 240, 255, 0.15)' },
          itemStyle: { color: '#00F0FF' },
          symbol: 'circle',
          symbolSize: 4,
        },
      ],
    }],
  };

  return (
    <motion.div 
      initial={{ x: 50, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      transition={{ delay: 0.2 }}
      className="glass-panel rounded-xl p-4 corner-bracket"
    >
      <span className="corner-bl" /><span className="corner-br" />
      
      <div className="flex items-center gap-2 mb-2">
        <Wifi className="w-5 h-5 text-cyber-gold" />
        <h3 className="text-base font-semibold text-white">分层分级体验</h3>
      </div>

      <div className="h-[200px]">
        <ReactECharts option={option} style={{ height: '100%' }} notMerge={true} />
      </div>
    </motion.div>
  );
}

// ========== 模块二：基础业务保障（App KQI Grid）==========
function AppKQIGrid() {
  const appData = [
    { name: '微信消息', metric: '20ms', label: '时延', status: 'good', icon: '💬' },
    { name: '抖音播放', metric: '高清', label: '画质', status: 'good', icon: '📱' },
    { name: '网页首屏', metric: '优', label: '体验', status: 'good', icon: '🌐' },
    { name: '扫码支付', metric: '99.99%', label: '成功', status: 'good', icon: '💳' },
  ];

  return (
    <motion.div 
      initial={{ x: 50, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      transition={{ delay: 0.3 }}
      className="glass-panel rounded-xl p-4 corner-bracket"
    >
      <span className="corner-bl" /><span className="corner-br" />
      
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-5 h-5 text-green-400" />
        <h3 className="text-base font-semibold text-white">基础业务保障</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {appData.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 * index }}
            className="bg-green-500/10 border border-green-500/20 rounded-lg p-2.5"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{item.icon}</span>
              <span className="text-xs text-white/70">{item.name}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-din text-green-400">{item.metric}</span>
              <span className="text-[9px] text-white/40">{item.label}</span>
            </div>
            <div className="mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-[9px] text-green-400/80">正常</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ========== 模块三：终端分析 V2 (top_devices_json) ===========
function TerminalAnalysisV2() {
  const { getComputedZoneData } = useDashboardStore();
  const zoneData = getComputedZoneData();
  
  // 取第一个区域的终端数据
  const firstZone = zoneData[0];
  const topDevices = firstZone?.top_devices || [];
  const penetration = firstZone?.fivega_penetration || 0;

  return (
    <motion.div 
      initial={{ x: 50, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      transition={{ delay: 0.35 }}
      className="glass-panel rounded-xl p-4 corner-bracket"
    >
      <span className="corner-bl" /><span className="corner-br" />
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-semibold text-white">终端分析 (V2)</h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-cyan-400/70">5G-A 渗透率</span>
          <span className="text-lg font-bold text-cyan-400">{penetration}%</span>
          <TrendingUp className="w-3 h-3 text-green-400" />
        </div>
      </div>

      {/* 终端 Top 5 */}
      <div className="space-y-2">
        {(topDevices.length > 0 ? topDevices : [
          { rank: 1, brand: '华为', model: 'Mate 60 Pro', users: 1250, is5GA: true },
          { rank: 2, brand: '苹果', model: 'iPhone 15 Pro', users: 1100, is5GA: true },
          { rank: 3, brand: '小米', model: '14 Pro', users: 890, is5GA: true },
        ]).map((device) => (
          <div 
            key={device.rank}
            className="flex items-center gap-3 p-2 bg-white/5 rounded-lg"
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              device.rank === 1 ? 'bg-yellow-400/20 text-yellow-400' :
              device.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
              device.rank === 3 ? 'bg-orange-400/20 text-orange-400' :
              'bg-white/10 text-white/60'
            }`}>
              {device.rank}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white text-sm">{device.brand} {device.model}</span>
                {device.is5GA && (
                  <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1 rounded">5G-A</span>
                )}
              </div>
              <div className="text-xs text-white/50">{device.users.toLocaleString()} 用户</div>
            </div>
          </div>
        ))}
      </div>

      {/* 数据来源 */}
      <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-white/30 text-right">
        数据来源: {firstZone?.zone_name || '南看台 F区'}
      </div>
    </motion.div>
  );
}

// ========== 模块四：智能根因诊断 ===========
function DiagnosticsAlerts() {
  const alerts = [
    { id: 1, title: '南看台F区容量告警', level: 'high', time: '2分钟前', cell_id: 'cell_003' },
    { id: 2, title: 'VIP区干扰排查', level: 'medium', time: '5分钟前', cell_id: 'cell_002' },
    { id: 3, title: '东看台切换频繁', level: 'low', time: '8分钟前', cell_id: 'cell_007' },
  ];

  return (
    <motion.div 
      initial={{ x: 50, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      transition={{ delay: 0.4 }}
      className="glass-panel rounded-xl p-4 corner-bracket"
    >
      <span className="corner-bl" /><span className="corner-br" />
      
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-yellow-400" />
        <h3 className="text-base font-semibold text-white">智能根因诊断</h3>
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            className={`p-2.5 rounded-lg border ${
              alert.level === 'high' ? 'bg-red-500/10 border-red-500/30' :
              alert.level === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
              'bg-cyan-500/10 border-cyan-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">{alert.title}</span>
              {alert.cell_id && (
                <span className="text-[10px] text-cyan-400/70 bg-cyan-400/10 px-1.5 py-0.5 rounded">
                  {alert.cell_id}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className={`text-xs ${
                alert.level === 'high' ? 'text-red-400' :
                alert.level === 'medium' ? 'text-yellow-400' :
                'text-cyan-400'
              }`}>
                {alert.level === 'high' ? '高优先级' : alert.level === 'medium' ? '中优先级' : '低优先级'}
              </span>
              <span className="text-xs text-white/40">{alert.time}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function RightPanelP2V2() {
  return (
    <div className="w-full h-full flex flex-col gap-3">
      <RadarExperience />
      <AppKQIGrid />
      <TerminalAnalysisV2 />
      <DiagnosticsAlerts />
    </div>
  );
}
