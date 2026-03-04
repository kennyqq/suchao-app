/**
 * P2 右侧面板 - BFF真实数据绑定版
 * 
 * 改造点：
 * 1. 接收父组件传递的data prop
 * 2. 绑定experienceRadar雷达图数据
 * 3. 绑定basicKQI业务KQI网格数据
 * 4. 使用ECharts setOption实现动态更新
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Shield, AlertTriangle, ChevronRight } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

// ========== 模块一：分层分级体验（雷达图）==========
function RadarExperience({ data }) {
  const chartRef = useRef(null);
  
  // 防御性取值
  const radar = data?.experienceRadar || {};
  const vipData = radar.vip || [850, 95, 98, 100, 95];
  const normalData = radar.normal || [400, 80, 75, 85, 70];
  
  // 指标配置
  const indicators = [
    { name: '下行速率', max: 1000 },
    { name: '语音清晰', max: 100 },
    { name: '视频卡顿', max: 100 },
    { name: '直播上行', max: 100 },
    { name: '低时延', max: 100 },
  ];
  
  const option = {
    legend: {
      data: ['VIP用户', '普通用户'],
      top: 0,
      left: 'center',
      textStyle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 10,
      },
      itemWidth: 10,
      itemHeight: 10,
    },
    radar: {
      indicator: indicators,
      center: ['50%', '55%'],
      radius: '55%',
      splitNumber: 4,
      axisName: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 9,
      },
      splitLine: {
        lineStyle: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(0, 240, 255, 0.02)', 'rgba(0, 240, 255, 0.05)'],
        },
      },
      axisLine: {
        lineStyle: { color: 'rgba(255, 255, 255, 0.1)' },
      },
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: vipData,
          name: 'VIP用户',
          lineStyle: { color: '#FFD700', width: 2 },
          areaStyle: { color: 'rgba(255, 215, 0, 0.2)' },
          itemStyle: { color: '#FFD700' },
          symbol: 'circle',
          symbolSize: 4,
        },
        {
          value: normalData,
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

  // 当数据变化时，动态更新图表（而非重新初始化）
  useEffect(() => {
    if (chartRef.current) {
      const echartsInstance = chartRef.current.getEchartsInstance();
      echartsInstance.setOption({
        series: [{
          data: [
            {
              value: vipData,
              name: 'VIP用户',
              lineStyle: { color: '#FFD700', width: 2 },
              areaStyle: { color: 'rgba(255, 215, 0, 0.2)' },
              itemStyle: { color: '#FFD700' },
              symbol: 'circle',
              symbolSize: 4,
            },
            {
              value: normalData,
              name: '普通用户',
              lineStyle: { color: '#00F0FF', width: 2 },
              areaStyle: { color: 'rgba(0, 240, 255, 0.15)' },
              itemStyle: { color: '#00F0FF' },
              symbol: 'circle',
              symbolSize: 4,
            },
          ],
        }],
      }, false); // false = 合并更新，不重置整个图表
    }
  }, [vipData, normalData]);

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
        <ReactECharts 
          ref={chartRef}
          option={option} 
          style={{ height: '100%' }} 
          notMerge={false} // 改为false支持增量更新
          lazyUpdate={true} // 懒更新优化性能
        />
      </div>
    </motion.div>
  );
}

// ========== 模块二：基础业务保障（App KQI Grid）==========
function AppKQIGrid({ data }) {
  // 防御性取值
  const basicKqi = data?.basicKqi || {};
  
  // 构造应用KQI数据 - 绑定真实数据
  const appData = [
    { 
      name: '微信消息', 
      metric: basicKqi.wechat?.delay || '--', 
      unit: 'ms',
      label: '时延', 
      status: (basicKqi.wechat?.delay || 0) < 50 ? 'good' : 'warning', 
      icon: '💬' 
    },
    { 
      name: '抖音播放', 
      metric: basicKqi.douyin?.definition || '未知', 
      unit: '',
      label: '画质', 
      status: (basicKqi.douyin?.bitrate || 0) > 10000 ? 'good' : 'normal', 
      icon: '📱' 
    },
    { 
      name: '游戏时延', 
      metric: basicKqi.game?.latency || '--', 
      unit: 'ms',
      label: '时延', 
      status: (basicKqi.game?.latency || 999) < 30 ? 'good' : 'warning', 
      icon: '🎮' 
    },
    { 
      name: '扫码支付', 
      metric: basicKqi.payment?.success || '--', 
      unit: '%',
      label: '成功', 
      status: (basicKqi.payment?.success || 0) > 99 ? 'good' : 'warning', 
      icon: '💳' 
    },
  ];

  // 状态样式映射
  const statusStyles = {
    good: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', dot: 'bg-green-400', label: '正常' },
    normal: { bg: 'bg-cyber-cyan/10', border: 'border-cyber-cyan/20', text: 'text-cyber-cyan', dot: 'bg-cyber-cyan', label: '良好' },
    warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400', label: '一般' },
    bad: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-400', label: '告警' },
  };

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
        {appData.map((item, index) => {
          const style = statusStyles[item.status] || statusStyles.normal;
          return (
            <motion.div
              key={item.name}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              className={`${style.bg} border ${style.border} rounded-lg p-2.5`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">{item.icon}</span>
                <span className="text-xs text-white/70">{item.name}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-din ${style.text}`}>{item.metric}</span>
                {item.unit && <span className={`text-xs ${style.text}`}>{item.unit}</span>}
                <span className="text-[9px] text-white/40">{item.label}</span>
              </div>
              <div className="mt-1 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                <span className={`text-[9px] ${style.text}/80`}>{style.label}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ========== 模块三：智能根因诊断 ===========
function DiagnosticsAlerts({ data }) {
  // 防御性取值 - 从alarms获取告警数据
  const alerts = data?.alarms || [
    { 
      level: 'high', 
      title: '南看台-干扰过高', 
      desc: '检测到外部干扰源',
      time: '2分钟前'
    },
    { 
      level: 'medium', 
      title: '西入口-弱覆盖', 
      desc: '信号强度低于阈值',
      time: '5分钟前'
    },
  ];

  // 级别样式映射
  const levelStyles = {
    high: { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-400' },
    medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500', text: 'text-yellow-400' },
    low: { bg: 'bg-cyber-cyan/10', border: 'border-cyber-cyan', text: 'text-cyber-cyan' },
  };

  return (
    <motion.div 
      initial={{ x: 50, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      transition={{ delay: 0.4 }}
      className="glass-panel rounded-xl p-4 corner-bracket flex-1"
    >
      <span className="corner-bl" /><span className="corner-br" />
      
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-cyber-gold" />
        <h3 className="text-base font-semibold text-white">智能根因诊断</h3>
      </div>

      <div className="space-y-2">
        {alerts.map((alert, index) => {
          const style = levelStyles[alert.level] || levelStyles.medium;
          return (
            <motion.div
              key={alert.title || index}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              className={`p-3 rounded-lg border-l-2 cursor-pointer transition-all hover:bg-opacity-20 ${style.bg} ${style.border}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${style.text}`}>
                    {alert.title}
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5">
                    {alert.desc}
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${style.text}/50`} />
              </div>
            </motion.div>
          );
        })}
        
        {/* 空状态提示 */}
        {alerts.length === 0 && (
          <div className="text-center py-6 text-white/40 text-sm">
            暂无告警，系统运行正常
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ========== 右侧面板主组件 ===========
export default function RightPanelP2({ data, isLoading }) {
  return (
    <div className="h-full flex flex-col gap-3">
      <RadarExperience data={data} />
      <AppKQIGrid data={data} />
      <DiagnosticsAlerts data={data} />
    </div>
  );
}
