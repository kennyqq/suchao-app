/**
 * P0 宏观溯源视图
 * 
 * 核心功能：
 * 1. 小时级时序回放 - 支持拖动时间轴查看历史数据
 * 2. 自动加载最新数据 - 默认显示最新时间点
 * 3. 防爆封顶指标展示 - 引流指数、交通压力、文旅压力
 * 
 * 数据流：
 * 1. 组件挂载 -> 获取 timeline-index -> 提取默认时间点
 * 2. 加载默认时间点数据 -> 渲染全屏
 * 3. 用户拖动时间轴 -> 加载对应时间点数据 -> 平滑更新
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Users, 
  MapPin, 
  TrendingUp, 
  Train, 
  Camera,
  Calendar,
  Play,
  Pause,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { 
  fetchP0TimelineIndex, 
  fetchP0Data, 
  getDefaultTimePoint
} from '../../api/p0';

// ========== 子组件 ==========

/**
 * 核心指标卡片
 */
function MetricCard({ title, value, unit, icon: Icon, color = 'cyan', subtitle, trend }) {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400'
  };

  // 🛡️ 安全兜底：确保 value 是数字
  const safeValue = typeof value === 'number' ? value : 0;
  const safeTrend = typeof trend === 'number' ? trend : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-panel rounded-xl p-5 border bg-gradient-to-br ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/60 text-sm">{title}</span>
        <Icon className={`w-5 h-5 ${colorClasses[color].split(' ').pop()}`} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-din font-bold text-white">{safeValue.toLocaleString()}</span>
        {unit && <span className="text-white/50 text-sm">{unit}</span>}
      </div>
      {subtitle && <div className="text-white/40 text-xs mt-2">{subtitle}</div>}
      {safeTrend !== null && (
        <div className={`text-xs mt-1 flex items-center gap-1 ${safeTrend > 0 ? 'text-green-400' : 'text-red-400'}`}>
          <TrendingUp className="w-3 h-3" />
          {safeTrend > 0 ? '+' : ''}{safeTrend}%
        </div>
      )}
    </motion.div>
  );
}

/**
 * 排行榜组件
 */
function RankingList({ title, icon: Icon, data, valueKey, labelKey, showPressure = false, pressureKey }) {
  // 🛡️ 安全兜底：确保 data 是数组
  const safeData = Array.isArray(data) ? data : [];
  
  if (safeData.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="w-5 h-5 text-cyber-cyan" />
          <h3 className="text-white font-medium">{title}</h3>
        </div>
        <div className="text-white/40 text-sm text-center py-8">暂无数据</div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-cyber-cyan" />
        <h3 className="text-white font-medium">{title}</h3>
      </div>
      <div className="space-y-2">
        {safeData.slice(0, 5).map((item, index) => (
          <motion.div
            key={item[labelKey] || index}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
              index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
              index === 1 ? 'bg-gray-400/20 text-gray-300' :
              index === 2 ? 'bg-amber-600/20 text-amber-500' :
              'bg-white/10 text-white/40'
            }`}>
              {item.rank || index + 1}
            </span>
            <span className="text-white/80 flex-1 truncate text-sm">{item[labelKey] || '未知'}</span>
            <span className="text-cyber-cyan font-din">{(item[valueKey] ?? 0).toLocaleString()}</span>
            {showPressure && pressureKey && item[pressureKey] !== undefined && (
              <span className={`text-xs px-2 py-0.5 rounded ${
                item[pressureKey] > 150 ? 'bg-red-500/20 text-red-400' :
                item[pressureKey] > 100 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {item[pressureKey]}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * 时间轴控制器
 */
function TimelineController({ 
  timeSlots, 
  currentIndex, 
  onChange, 
  currentTime,
  isPlaying,
  onPlayPause,
  onPrev,
  onNext
}) {
  // 🛡️ 安全兜底：确保 timeSlots 是有效数组
  const safeTimeSlots = Array.isArray(timeSlots) ? timeSlots : [];
  const safeIndex = typeof currentIndex === 'number' ? currentIndex : 0;
  
  if (safeTimeSlots.length === 0) return null;

  return (
    <div className="glass-panel rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-4 mb-4">
        <button 
          onClick={onPrev}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <SkipBack className="w-5 h-5 text-white" />
        </button>
        
        <button 
          onClick={onPlayPause}
          className="p-3 rounded-lg bg-cyber-cyan/20 hover:bg-cyber-cyan/30 border border-cyber-cyan/50 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-cyber-cyan" />
          ) : (
            <Play className="w-6 h-6 text-cyber-cyan" />
          )}
        </button>
        
        <button 
          onClick={onNext}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <SkipForward className="w-5 h-5 text-white" />
        </button>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-cyber-cyan" />
            <span className="text-white font-din text-2xl">{currentTime}</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, safeTimeSlots.length - 1)}
            value={Math.min(safeIndex, safeTimeSlots.length - 1)}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val >= 0 && val < safeTimeSlots.length) {
                onChange(val);
              }
            }}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyber-cyan"
          />
          <div className="flex justify-between text-white/40 text-xs mt-1">
            <span>{safeTimeSlots[0] || '--:--'}</span>
            <span>{safeTimeSlots[safeTimeSlots.length - 1] || '--:--'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== 主组件 ==========

export default function P0() {
  // 状态
  const [timelineIndex, setTimelineIndex] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [currentTimePoint, setCurrentTimePoint] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);

  // 当前日期的时间刻度 - 🛡️ 安全兜底
  const currentTimeSlots = useMemo(() => {
    if (!timelineIndex || !currentTimePoint?.date) return [];
    const slots = timelineIndex.timeSlots?.[currentTimePoint.date];
    return Array.isArray(slots) ? slots : [];
  }, [timelineIndex, currentTimePoint]);

  // 1. 组件挂载：获取时间轴索引
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 获取时间轴索引
        const index = await fetchP0TimelineIndex();
        setTimelineIndex(index);
        
        // 提取默认时间点（最新一天、最晚时间）
        const defaultPoint = getDefaultTimePoint(index);
        if (!defaultPoint) {
          throw new Error('无法获取默认时间点');
        }
        
        setCurrentTimePoint(defaultPoint);
        
        // 设置当前索引
        const slots = index.timeSlots[defaultPoint.date] || [];
        const indexInSlots = slots.indexOf(defaultPoint.time);
        setCurrentIndex(indexInSlots >= 0 ? indexInSlots : slots.length - 1);
        
        // 加载默认时间点数据
        const data = await fetchP0Data(defaultPoint.date, defaultPoint.time);
        setCurrentData(data);
        
      } catch (err) {
        console.error('[P0] 初始化失败:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, []);

  // 2. 处理时间轴变化
  const handleTimeChange = useCallback(async (newIndex) => {
    if (!timelineIndex || !currentTimePoint || isLoading) return;
    
    // 🛡️ 安全兜底：确保 slots 是数组且 newIndex 有效
    const slots = timelineIndex.timeSlots?.[currentTimePoint.date] || [];
    if (!Array.isArray(slots) || slots.length === 0) return;
    
    const newTime = slots[newIndex];
    if (!newTime || typeof newTime !== 'string') {
      console.warn('[P0] 无效的时间点:', newIndex, slots);
      return;
    }
    
    try {
      setIsLoading(true);
      setCurrentIndex(newIndex);
      
      const data = await fetchP0Data(currentTimePoint.date, newTime);
      setCurrentData(data);
      
    } catch (err) {
      console.error('[P0] 加载数据失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timelineIndex, currentTimePoint, isLoading]);

  // 3. 播放控制
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const max = currentTimeSlots.length - 1;
        if (prev >= max) {
          setIsPlaying(false);
          return prev;
        }
        const next = prev + 1;
        handleTimeChange(next);
        return next;
      });
    }, 2000); // 每2秒播放下一帧
    
    return () => clearInterval(interval);
  }, [isPlaying, currentTimeSlots.length, handleTimeChange]);

  // 处理上一帧/下一帧
  const handlePrev = () => {
    // 🛡️ 安全兜底：确保 currentIndex 有效
    if (typeof currentIndex === 'number' && currentIndex > 0) {
      handleTimeChange(currentIndex - 1);
    }
  };

  const handleNext = () => {
    // 🛡️ 安全兜底：确保时间槽有效且索引在范围内
    const slots = timelineIndex?.timeSlots?.[currentTimePoint?.date] || [];
    if (typeof currentIndex === 'number' && currentIndex < slots.length - 1) {
      handleTimeChange(currentIndex + 1);
    }
  };

  // 渲染加载状态
  if (isLoading && !currentData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-cyber-cyan border-t-transparent rounded-full mx-auto mb-4" />
          <div className="text-cyber-cyan">加载 P0 数据中...</div>
        </div>
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-2">加载失败</div>
          <div className="text-white/60">{error}</div>
        </div>
      </div>
    );
  }

  // 🚑 致命调试：确认数据是否到达
  console.log('====== 🚑 P0 真实接收到的状态数据 ======', currentData);
  console.log('====== 🚑 timelineIndex 状态 ======', timelineIndex);
  
  // 数据解包：fetchP0Data 已经返回 result.data，所以 currentData 本身就是业务数据
  const data = currentData;
  
  // ====== 数据映射与兜底 ======
  // 1. 省外 TOP8 - 映射为 {name, value}
  const outProvinceList = (data?.out_province_rank || []).map(item => ({
    name: item.out_province_city_name || '未知',
    value: item.out_province_visitor_count || 0,
    rank: item.rank || 1
  }));
  
  // 2. 省内 TOP8 - 映射为 {name, value}
  const inProvinceList = (data?.in_province_rank || []).map(item => ({
    name: item.in_province_city_name || '未知',
    value: item.in_province_visitor_count || 0,
    rank: item.rank || 1
  }));
  
  // 3. 交通枢纽 - 映射为 {name, value, pressure}
  const transportList = (data?.transport_rank || []).map(item => ({
    name: item.transport_poi_name || '未知',
    value: item.transport_current_traffic || 0,
    pressure: item.transport_pressure_index || 0,
    rank: item.rank || 1
  }));
  
  // 4. 文旅景点 - 映射为 {name, value, pressure}
  const tourismList = (data?.tourism_rank || []).map(item => ({
    name: item.tourism_poi_name || '未知',
    value: item.tourism_current_traffic || 0,
    pressure: item.tourism_pressure_index || 0,
    rank: item.rank || 1
  }));
  
  // 5. 日期列表兜底
  const availableDates = timelineIndex?.availableDates || [];
  
  // 6. 当前日期的时间槽兜底
  const timeSlotsForCurrentDate = (timelineIndex?.timeSlots && currentTimePoint?.date) 
    ? (timelineIndex.timeSlots[currentTimePoint.date] || []) 
    : [];

  return (
    <div className="w-full h-full flex flex-col p-4 overflow-hidden">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-cyber-cyan" />
            宏观溯源
          </h1>
          <p className="text-white/40 text-sm">
            {currentTimePoint?.formatted} | 小时级时序回放
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass-panel px-4 py-2 rounded-lg border border-white/10">
            <Calendar className="w-4 h-4 text-cyber-cyan inline mr-2" />
            <span className="text-white">{currentTimePoint?.date?.slice(0,4)}-{currentTimePoint?.date?.slice(4,6)}-{currentTimePoint?.date?.slice(6,8)}</span>
          </div>
        </div>
      </div>

      {/* 核心指标区 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <MetricCard
          title="实时外来客流"
          value={data?.realtime_outsider_count || 0}
          unit="人"
          icon={Users}
          color="cyan"
          subtitle="驻留≥30分钟"
        />
        <MetricCard
          title="场馆周边热力"
          value={data?.venue_surrounding_count || 0}
          unit="人"
          icon={MapPin}
          color="yellow"
          subtitle="场馆周边实时"
        />
        <MetricCard
          title="累计外来客流"
          value={data?.cumulative_outsider_count || 0}
          unit="人"
          icon={TrendingUp}
          color="green"
          subtitle="今日0点至今"
        />
        <MetricCard
          title="引流指数"
          value={data?.drainage_index || 0}
          unit=""
          icon={TrendingUp}
          color={data?.drainage_index > 200 ? 'red' : data?.drainage_index > 100 ? 'yellow' : 'green'}
          subtitle={data?.drainage_index >= 300 ? '已达封顶值' : '相对于基准客流'}
        />
      </div>

      {/* 中间内容区 */}
      <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
        {/* 左侧：排行榜 */}
        <div className="space-y-4 overflow-auto">
          <RankingList
            title="省外来源城市 TOP10"
            icon={MapPin}
            data={outProvinceList}
            labelKey="name"
            valueKey="value"
          />
          <RankingList
            title="省内来源城市 TOP8"
            icon={MapPin}
            data={inProvinceList}
            labelKey="name"
            valueKey="value"
          />
        </div>

        {/* 中间：地图或可视化占位 */}
        <div className="glass-panel rounded-xl border border-white/10 flex items-center justify-center">
          <div className="text-center text-white/40">
            <div className="text-6xl mb-4">🗺️</div>
            <div>地图可视化区域</div>
            <div className="text-sm mt-2">三日累计外来客流: {data?.three_day_visitor_count?.toLocaleString()} 人</div>
          </div>
        </div>

        {/* 右侧：排行榜 */}
        <div className="space-y-4 overflow-auto">
          <RankingList
            title="交通枢纽压力 TOP5"
            icon={Train}
            data={transportList}
            labelKey="name"
            valueKey="value"
            showPressure={true}
            pressureKey="pressure"
          />
          <RankingList
            title="文旅景点压力 TOP5"
            icon={Camera}
            data={tourismList}
            labelKey="name"
            valueKey="value"
            showPressure={true}
            pressureKey="pressure"
          />
        </div>
      </div>

      {/* 日期选择器 */}
      <div className="mt-4 flex items-center gap-4">
        <div className="glass-panel px-4 py-2 rounded-lg border border-white/10">
          <select 
            className="bg-transparent text-white outline-none cursor-pointer"
            value={currentTimePoint?.date || ''}
            onChange={(e) => {
              const newDate = e.target.value;
              if (newDate && timelineIndex?.timeSlots?.[newDate]) {
                const slots = timelineIndex.timeSlots[newDate];
                const newTimePoint = {
                  date: newDate,
                  time: slots[slots.length - 1],
                  formatted: `${newDate.slice(0,4)}-${newDate.slice(4,6)}-${newDate.slice(6,8)} ${slots[slots.length - 1]}`
                };
                setCurrentTimePoint(newTimePoint);
                setCurrentIndex(slots.length - 1);
                // 加载新日期的数据
                handleTimeChange(slots.length - 1);
              }
            }}
          >
            {availableDates.length === 0 && (
              <option value="">加载中...</option>
            )}
            {availableDates.map(dateStr => {
              const month = parseInt(dateStr.slice(4, 6), 10);
              const day = parseInt(dateStr.slice(6, 8), 10);
              return (
                <option key={dateStr} value={dateStr} className="bg-cyber-dark">
                  {month}月{day}日
                </option>
              );
            })}
          </select>
        </div>
        
        {/* 底部时间轴控制器 */}
        <div className="flex-1">
          <TimelineController
            timeSlots={timeSlotsForCurrentDate}
            currentIndex={currentIndex}
            onChange={handleTimeChange}
            currentTime={currentTimePoint?.time}
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        </div>
      </div>

      {/* 加载遮罩 */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div className="text-cyber-cyan">加载中...</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
