/**
 * P2 左侧面板 - BFF真实数据绑定版
 * 
 * 改造点：
 * 1. 接收父组件传递的data prop
 * 2. 绑定userTiers金字塔数据
 * 3. 绑定capacity饱和度数据
 * 4. 绑定terminals终端排行数据
 */

import { motion } from 'framer-motion';
import { Users, Activity, Smartphone } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

// ========== 模块一：分层分级用户（金字塔漏斗图）==========
function PyramidFunnel({ data }) {
  // 防御性取值，如果数据未加载则使用空数组
  const userTiers = data?.userTiers || [];
  
  // 计算总用户数
  const total = userTiers.reduce((sum, item) => sum + (item.value || 0), 0);

  return (
    <motion.div 
      initial={{ x: -50, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      transition={{ delay: 0.2 }}
      className="glass-panel rounded-xl p-4 corner-bracket"
    >
      <span className="corner-bl" /><span className="corner-br" />
      
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-cyber-gold" />
        <h3 className="text-base font-semibold text-white">分层分级用户</h3>
      </div>

      {/* 金字塔漏斗 - 动态绑定userTiers数据 */}
      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-[180px]">
          {userTiers.map((item, index) => (
            <motion.div
              key={item.label || index}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              className="mx-auto mb-1 relative"
              style={{ width: item.width || '50%' }}
            >
              <div
                className="h-12 flex items-center justify-center text-xs font-medium"
                style={{
                  background: `linear-gradient(180deg, ${item.color}30 0%, ${item.color}50 100%)`,
                  border: `1px solid ${item.color}`,
                  borderRadius: index === 0 ? '4px 4px 0 0' : index === userTiers.length - 1 ? '0 0 4px 4px' : '0',
                  clipPath: index === 0 
                    ? 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)'  // 顶层：正梯形
                    : index === userTiers.length - 1
                    ? 'polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)'  // 底层：倒梯形
                    : 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',  // 中层：正梯形
                }}
              >
                <div className="flex flex-col items-center">
                  <span className="text-white text-[10px] font-medium">{item.label}</span>
                  <span className="text-[9px]" style={{ color: item.color }}>
                    {(item.value || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 总数 - 绑定真实数据 */}
        <div className="mt-3 text-center">
          <div className="text-[10px] text-white/40">总用户数</div>
          <div className="text-2xl font-din text-white">{total.toLocaleString()}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ========== 模块二：放号评估智能体 ===========
function CapacityAgent({ data }) {
  // 防御性取值
  const saturation = data?.capacity?.saturation || {};
  const currentRate = saturation.currentRate || 0;
  const status = saturation.status || 'normal';
  const currentUsers = saturation.currentUsers || 0;
  const capacity = saturation.capacity || 60000;
  const remaining = saturation.remaining || 0;
  
  // 根据状态确定徽章样式
  const statusConfig = {
    normal: { text: '建议推广', color: 'green', bgColor: 'bg-green-500/20', textColor: 'text-green-400' },
    caution: { text: '关注', color: 'yellow', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400' },
    warning: { text: '预警', color: 'orange', bgColor: 'bg-orange-500/20', textColor: 'text-orange-400' },
    critical: { text: '饱和', color: 'red', bgColor: 'bg-red-500/20', textColor: 'text-red-400' }
  };
  
  const currentStatus = statusConfig[status] || statusConfig.normal;
  
  // 预测折线图配置
  const lineOption = {
    grid: { top: 25, right: 10, bottom: 25, left: 10 },
    xAxis: {
      type: 'category',
      data: ['-30分', '-20分', '-10分', '当前', '+10分', '+20分', '+30分'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
    },
    yAxis: { 
      type: 'value', 
      show: false, 
      min: 55, 
      max: 70,
    },
    series: [
      // 历史数据（青色实线+圆点）
      {
        data: [
          { value: Math.max(55, currentRate - 5), symbol: 'none' },
          { value: Math.max(55, currentRate - 2), symbol: 'circle', symbolSize: 6, itemStyle: { color: '#00F0FF' } },
          { value: Math.max(55, currentRate - 1), symbol: 'circle', symbolSize: 6, itemStyle: { color: '#00F0FF' } },
          { value: currentRate, symbol: 'circle', symbolSize: 8, itemStyle: { color: '#00F0FF', borderColor: '#fff', borderWidth: 2 } },
        ],
        type: 'line',
        smooth: true,
        lineStyle: { color: '#00F0FF', width: 2 },
        symbol: 'none',
      },
      // 预测数据（黄色虚线/实线+菱形点）
      {
        data: [
          { value: currentRate, symbol: 'none' },
          { value: Math.min(70, currentRate + 1), symbol: 'diamond', symbolSize: 6, itemStyle: { color: '#FFD700' } },
          { value: Math.min(70, currentRate + 2), symbol: 'diamond', symbolSize: 6, itemStyle: { color: '#FFD700' } },
          { value: Math.min(70, currentRate + 3), symbol: 'diamond', symbolSize: 6, itemStyle: { color: '#FFD700' } },
          { value: Math.min(70, currentRate + 5), symbol: 'diamond', symbolSize: 8, itemStyle: { color: '#FFD700' } },
        ],
        type: 'line',
        smooth: true,
        lineStyle: { color: '#FFD700', width: 2, type: 'solid' },
        symbol: 'none',
      },
    ],
  };

  return (
    <motion.div 
      initial={{ x: -50, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      transition={{ delay: 0.3 }}
      className="glass-panel rounded-xl p-4 corner-bracket"
    >
      <span className="corner-bl" /><span className="corner-br" />
      
      {/* 头部标题 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-cyber-cyan/20 flex items-center justify-center">
          <Activity className="w-4 h-4 text-cyber-cyan" />
        </div>
        <h3 className="text-base font-semibold text-white">放号评估智能体</h3>
      </div>

      {/* 主内容区 - 左右分栏 */}
      <div className="flex gap-4">
        {/* 左侧：缺口环形 + 状态 */}
        <div className="w-[110px] flex flex-col items-center">
          {/* 缺口环形进度条 - 绑定真实饱和度数据 */}
          <div className="relative w-24 h-20">
            <svg className="w-full h-full" viewBox="0 0 100 60">
              {/* 背景圆弧 */}
              <path
                d="M 10 50 A 40 40 0 1 1 90 50"
                fill="none"
                stroke="rgba(0,240,255,0.1)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* 进度圆弧 - 动态绑定currentRate */}
              <path
                d="M 10 50 A 40 40 0 1 1 90 50"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${currentRate * 1.5} 251`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00F0FF" />
                  <stop offset="100%" stopColor="#00FF88" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
              <span className="text-xl font-din text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan to-green-400">
                {currentRate.toFixed(1)}%
              </span>
            </div>
          </div>
          
          {/* 放号空间使用率文字 */}
          <div className="text-xs text-white/40 mt-1">容量使用率</div>
          
          {/* 人数统计 */}
          <div className="mt-2 text-center">
            <div className="text-[10px] text-white/60">{currentUsers.toLocaleString()} / {capacity.toLocaleString()}</div>
          </div>
          
          {/* 状态徽章 - 动态绑定status */}
          <div className={`mt-3 px-3 py-1 rounded-full ${currentStatus.bgColor} border border-${currentStatus.color}-500/40 ${currentStatus.textColor} text-xs font-medium`}>
            {currentStatus.text}
          </div>
        </div>

        {/* 右侧：折线图区域 */}
        <div className="flex-1">
          {/* 图表标题栏 */}
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
              <polyline points="17,6 23,6 23,12" />
            </svg>
            <span className="text-sm text-white/70 whitespace-nowrap">未来30min预测</span>
          </div>

          {/* 折线图 */}
          <div className="h-20">
            <ReactECharts 
              option={lineOption} 
              style={{ height: '100%', width: '100%' }} 
              notMerge={true}
            />
          </div>

          {/* 剩余容量 */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-white/40">剩余容量</span>
            <span className="text-sm font-din text-cyber-cyan">{remaining.toLocaleString()} 人</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ========== 模块三：终端能力分析 ===========
function TerminalAnalysis({ data }) {
  // 防御性取值
  const terminals = data?.terminals || {};
  const total5GARatio = terminals.total5GARatio || 0;
  const ranking = terminals.ranking || [];

  return (
    <motion.div 
      initial={{ x: -50, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      transition={{ delay: 0.4 }}
      className="glass-panel rounded-xl p-4 corner-bracket flex-1"
    >
      <span className="corner-bl" /><span className="corner-br" />
      
      <div className="flex items-center gap-2 mb-3">
        <Smartphone className="w-5 h-5 text-cyber-cyan" />
        <h3 className="text-base font-semibold text-white">终端能力分析</h3>
      </div>

      <div className="flex gap-3">
        {/* 左侧：5G-A 渗透率环形图 - 绑定真实数据 */}
        <div className="w-[90px] flex flex-col items-center justify-center">
          <div className="relative w-16 h-16">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(139,92,246,0.2)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="3"
                strokeDasharray={`${total5GARatio}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-din text-white">{total5GARatio.toFixed(1)}%</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-white/60 text-center">5G-A<br/>渗透率</div>
        </div>

        {/* 右侧：TOP终端排行 - 动态绑定ranking数据 */}
        <div className="flex-1 space-y-2">
          {ranking.slice(0, 5).map((item, index) => (
            <motion.div
              key={item.model || index}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-center justify-between text-xs"
            >
              {/* 左侧：排名 + 终端型号 */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* 排名 */}
                <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  item.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                  item.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                  item.rank === 3 ? 'bg-amber-600/20 text-amber-500' :
                  'bg-white/10 text-white/40'
                }`}>
                  {item.rank}
                </span>
                
                {/* 终端型号 - 只显示model，不重复显示brand */}
                <span className="text-white/90 truncate font-medium">{item.model}</span>
              </div>
              
              {/* 右侧：用户数 + 网络能力徽章 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* 用户数 */}
                <span className="text-white/50 text-[10px]">{item.count?.toLocaleString()}人</span>
                
                {/* 网络能力徽章 - 微型胶囊样式 */}
                {item.capability === '5G-A' ? (
                  /* 5G-A: 金色发光徽章 */
                  <span className="px-2 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-[0_0_8px_rgba(234,179,8,0.3)] font-medium">
                    5G-A
                  </span>
                ) : item.capability === '5G' ? (
                  /* 5G: 青蓝色低调徽章 */
                  <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
                    5G
                  </span>
                ) : (
                  /* 兜底: 默认5G徽章 */
                  <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
                    5G
                  </span>
                )}
              </div>
            </motion.div>
          ))}
          
          {/* 如果没有数据，显示占位 */}
          {ranking.length === 0 && (
            <div className="text-xs text-white/40 text-center py-4">暂无终端数据</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ========== 左侧面板主组件 ===========
export default function LeftPanelP2({ data, isLoading }) {
  return (
    <div className="h-full flex flex-col gap-3">
      <PyramidFunnel data={data} />
      <CapacityAgent data={data} />
      <TerminalAnalysis data={data} />
    </div>
  );
}
