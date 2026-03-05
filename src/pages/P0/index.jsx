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
        <span className="text-3xl font-din font-bold text-white">{value.toLocaleString()}</span>
        {unit && <span className="text-white/50 text-sm">{unit}</span>}
      </div>
      {subtitle && <div className="text-white/40 text-xs mt-2">{subtitle}</div>}
      {trend && (
        <div className={`text-xs mt-1 flex items-center gap-1 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
          <TrendingUp className="w-3 h-3" />
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </motion.div>
  );
}

/**
 * 排行榜组件
 */
function RankingList({ title, icon: Icon, data, valueKey, labelKey, showPressure = false }) {
  if (!data || data.length === 0) {
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
        {data.slice(0, 5).map((item, index) => (
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
            <span className="text-white/80 flex-1 truncate text-sm">{item[labelKey]}</span>
            <span className="text-cyber-cyan font-din">{item[valueKey]?.toLocaleString()}</span>
            {showPressure && item.transport_pressure_index !== undefined && (
              <span className={`text-xs px-2 py-0.5 rounded ${
                item.transport_pressure_index > 150 ? 'bg-red-500/20 text-red-400' :
                item.transport_pressure_index > 100 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {item.transport_pressure_index}
              </span>
            )}
            {showPressure && item.tourism_pressure_index !== undefined && (
              <span className={`text-xs px-2 py-0.5 rounded ${
                item.tourism_pressure_index > 150 ? 'bg-red-500/20 text-red-400' :
                item.tourism_pressure_index > 100 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {item.tourism_pressure_index}
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
  if (!timeSlots || timeSlots.length === 0) return null;

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
            max={timeSlots.length - 1}
            value={currentIndex}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyber-cyan"
          />
          <div className="flex justify-between text-white/40 text-xs mt-1">
            <span>{timeSlots[0]}</span>
            <span>{timeSlots[timeSlots.length - 1]}</span>
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

  // 当前日期的时间刻度
  const currentTimeSlots = useMemo(() => {
    if (!timelineIndex || !currentTimePoint) return [];
    return timelineIndex.timeSlots[currentTimePoint.date] || [];
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
    
    const slots = timelineIndex.timeSlots[currentTimePoint.date] || [];
    const newTime = slots[newIndex];
    if (!newTime) return;
    
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
    if (currentIndex > 0) {
      handleTimeChange(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < currentTimeSlots.length - 1) {
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

  const data = currentData?.data;

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
            data={data?.out_province_rank}
            labelKey="out_province_city_name"
            valueKey="out_province_visitor_count"
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
            data={data?.transport_rank}
            labelKey="transport_poi_name"
            valueKey="transport_current_traffic"
            showPressure={true}
          />
          <RankingList
            title="文旅景点压力 TOP5"
            icon={Camera}
            data={data?.tourism_rank}
            labelKey="tourism_poi_name"
            valueKey="tourism_current_traffic"
            showPressure={true}
          />
        </div>
      </div>

      {/* 底部时间轴控制器 */}
      <div className="mt-4">
        <TimelineController
          timeSlots={currentTimeSlots}
          currentIndex={currentIndex}
          onChange={handleTimeChange}
          currentTime={currentTimePoint?.time}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onPrev={handlePrev}
          onNext={handleNext}
        />
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
