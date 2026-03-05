import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Calendar, ChevronDown } from 'lucide-react';

// 三种指标的默认配置（当没有外部数据时使用）
const DEFAULT_METRICS_CONFIG = {
  crowd: {
    label: '人流',
    unit: '万人',
    icon: '👥',
    threshold: 8.0,
  },
  traffic: {
    label: '流量',
    unit: 'TB',
    icon: '📶',
    threshold: 8.0,
  },
  fiveGA: {
    label: '5G-A用户流量',
    unit: 'Gbps',
    icon: '📱',
    threshold: 10.0,
  },
};

export default function TimelineV3({ 
  onTimeChange, 
  onMetricChange, 
  externalTime,
  timelineIndex,
  currentTimePoint,
  currentIndex: externalCurrentIndex,
  isPlaying: externalIsPlaying,
  onPlayPause,
  onPrev,
  onNext,
  onDateChange,
}) {
  // 从 timelineIndex 获取可用日期列表
  const availableDates = useMemo(() => {
    if (!timelineIndex || !timelineIndex.availableDates) return [];
    return timelineIndex.availableDates.map(dateStr => {
      const month = parseInt(dateStr.slice(4, 6), 10);
      const day = parseInt(dateStr.slice(6, 8), 10);
      return {
        value: dateStr,
        label: `${month}月${day}日`,
        fullDate: dateStr,
        isToday: dateStr === currentTimePoint?.date,
      };
    });
  }, [timelineIndex, currentTimePoint]);

  // 从 timelineIndex 获取当前日期的时间槽
  const timeSlots = useMemo(() => {
    if (!timelineIndex || !currentTimePoint) return [];
    return timelineIndex.timeSlots[currentTimePoint.date] || [];
  }, [timelineIndex, currentTimePoint]);

  // 使用外部传入的状态或内部状态
  const [internalIndex, setInternalIndex] = useState(0);
  const [internalPlaying, setInternalPlaying] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('crowd');
  const [showMetricDropdown, setShowMetricDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // 优先使用外部状态
  const currentIndex = externalCurrentIndex !== undefined ? externalCurrentIndex : internalIndex;
  const isPlaying = externalIsPlaying !== undefined ? externalIsPlaying : internalPlaying;

  // 当前时间和值
  const currentTime = timeSlots[currentIndex] || '--:--';
  const currentMetricConfig = DEFAULT_METRICS_CONFIG[selectedMetric];
  
  // 生成模拟数据用于柱状图显示（基于实际人流数据或默认）
  const metricData = useMemo(() => {
    if (timeSlots.length === 0) return [];
    // 这里使用简单的模拟数据，实际可以从API获取历史趋势
    return timeSlots.map((_, i) => {
      const baseValue = selectedMetric === 'crowd' ? 5 : selectedMetric === 'traffic' ? 8 : 2;
      const peakIndex = Math.floor(timeSlots.length * 0.6);
      const distanceFromPeak = Math.abs(i - peakIndex);
      const factor = Math.max(0, 1 - distanceFromPeak / (timeSlots.length / 3));
      return Math.max(0.5, baseValue + baseValue * factor * 0.8 + (Math.random() - 0.5) * baseValue * 0.2);
    });
  }, [timeSlots, selectedMetric]);

  const currentValue = metricData[currentIndex] || 0;
  const maxValue = Math.max(...metricData, 1);

  // 当前选中的日期
  const selectedDate = useMemo(() => {
    if (!currentTimePoint || availableDates.length === 0) {
      return { value: '', label: '选择日期' };
    }
    return availableDates.find(d => d.value === currentTimePoint.date) || availableDates[0];
  }, [currentTimePoint, availableDates]);

  // 播放控制 - 如果没有外部控制，使用内部控制
  useEffect(() => {
    if (externalIsPlaying !== undefined || !isPlaying) return;
    
    let interval;
    interval = setInterval(() => {
      setInternalIndex((prev) => {
        if (prev >= timeSlots.length - 1) {
          setInternalPlaying(false);
          return prev;
        }
        const next = prev + 1;
        if (onTimeChange) {
          onTimeChange(next);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, timeSlots.length, externalIsPlaying, onTimeChange]);

  // 通知父组件时间变化
  useEffect(() => {
    if (onTimeChange && externalCurrentIndex === undefined) {
      onTimeChange({ time: currentTime, value: currentValue, metric: selectedMetric });
    }
  }, [currentIndex, selectedMetric, externalCurrentIndex]);

  const handlePlay = () => {
    if (onPlayPause) {
      onPlayPause();
    } else {
      setInternalPlaying(!internalPlaying);
    }
  };
  
  const handleReset = () => {
    if (onPlayPause) onPlayPause();
    else setInternalPlaying(false);
    
    const resetIndex = Math.floor(timeSlots.length / 2);
    if (onTimeChange) onTimeChange(resetIndex);
    else setInternalIndex(resetIndex);
  };
  
  const handlePrev = () => {
    if (onPrev) {
      onPrev();
    } else {
      setInternalIndex(Math.max(0, currentIndex - 1));
      setInternalPlaying(false);
    }
  };
  
  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      setInternalIndex(Math.min(timeSlots.length - 1, currentIndex + 1));
      setInternalPlaying(false);
    }
  };

  const handleSliderChange = (e) => {
    const newIndex = parseInt(e.target.value);
    if (onTimeChange) {
      onTimeChange(newIndex);
    } else {
      setInternalIndex(newIndex);
      setInternalPlaying(false);
    }
  };

  const handleMetricChange = (metric) => {
    setSelectedMetric(metric);
    setShowMetricDropdown(false);
    if (onMetricChange) {
      onMetricChange(metric);
    }
  };

  const handleDateSelect = (date) => {
    setShowDateDropdown(false);
    if (onDateChange) {
      onDateChange(date.value);
    }
  };

  // 判断是否为波峰
  const isPeak = (value) => value >= currentMetricConfig.threshold;

  // 计算柱子的渐变颜色
  const getBarGradient = (value, index, isActive) => {
    if (isPeak(value)) {
      return 'linear-gradient(180deg, rgba(255, 215, 0, 0.9) 0%, rgba(255, 165, 0, 0.6) 50%, rgba(255, 215, 0, 0.3) 100%)';
    }
    if (isActive) {
      return 'linear-gradient(180deg, rgba(0, 240, 255, 0.7) 0%, rgba(0, 191, 255, 0.4) 50%, rgba(0, 240, 255, 0.2) 100%)';
    }
    return 'linear-gradient(180deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 240, 255, 0.08) 50%, rgba(0, 240, 255, 0.02) 100%)';
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-[#0B1A2A]/90 backdrop-blur-md border border-cyber-cyan/20 rounded-xl h-[76px] flex items-center px-4">
        
        {/* 1. 日期选择区 */}
        <div className="flex items-center gap-3 w-[140px] shrink-0">
          <div className="w-9 h-9 rounded-lg bg-cyber-cyan/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-cyber-cyan" />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-1 text-white hover:text-cyber-cyan transition-colors"
            >
              <span className="text-sm font-medium">{selectedDate.label}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDateDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full left-0 mb-2 w-32 max-h-48 overflow-y-auto bg-cyber-dark border border-cyber-cyan/30 rounded-lg shadow-lg scrollbar-cyber"
              >
                {availableDates.length > 0 ? availableDates.map((date) => (
                  <button
                    key={date.value}
                    onClick={() => handleDateSelect(date)}
                    className={`w-full px-3 py-2 text-xs text-left hover:bg-cyber-cyan/10 transition-colors ${
                      selectedDate?.value === date.value ? 'bg-cyber-cyan/20 text-cyber-cyan' : 'text-white/70'
                    }`}
                  >
                    {date.label}
                    {date.isToday && <span className="ml-2 text-[10px] text-cyber-cyan">今日</span>}
                  </button>
                )) : (
                  <div className="px-3 py-2 text-xs text-white/40">加载中...</div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-10 bg-white/10 mx-3" />

        {/* 2. 指标选择器 */}
        <div className="relative w-[120px] shrink-0">
          <button 
            onClick={() => setShowMetricDropdown(!showMetricDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-cyber-dark/50 border border-cyber-cyan/30 hover:border-cyber-cyan/50 transition-colors"
          >
            <span className="text-sm text-white truncate">
              {currentMetricConfig.icon} {currentMetricConfig.label}
            </span>
            <ChevronDown className={`w-4 h-4 text-white/50 transition-transform flex-shrink-0 ${showMetricDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showMetricDropdown && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full left-0 mb-2 w-full bg-cyber-dark border border-cyber-cyan/30 rounded-lg overflow-hidden shadow-lg"
            >
              {Object.entries(METRICS_DATA).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => handleMetricChange(key)}
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-cyber-cyan/10 transition-colors ${
                    selectedMetric === key ? 'bg-cyber-cyan/20 text-cyber-cyan' : 'text-white/70'
                  }`}
                >
                  {data.icon} {data.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* 分隔线 */}
        <div className="w-px h-10 bg-white/10 mx-3" />

        {/* 3. 播放控制区 */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={handlePrev} className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors">
            <SkipBack className="w-4 h-4" />
          </button>
          <button 
            onClick={handlePlay}
            className={`p-2 rounded-lg border transition-all ${
              isPlaying 
                ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan' 
                : 'border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/10'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={handleNext} className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors">
            <SkipForward className="w-4 h-4" />
          </button>
          <button onClick={handleReset} className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-10 bg-white/10 mx-3" />

        {/* 4. 时间显示与核心轨道（占据最大空间） */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 时间显示 */}
          <div className="flex items-center gap-4 mb-1">
            <div>
              <div className="text-[10px] text-white/40">当前时间</div>
              <div className="text-xl font-din text-cyber-cyan">{currentTime}</div>
            </div>
          </div>

          {/* 柱状图轨道 */}
          <div className="relative h-8 flex items-end">
            {/* 柱状图背景 - 变细并使用渐变 */}
            <div className="absolute inset-0 flex items-end gap-[1px]">
              {metricData.map((value, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t-sm transition-all duration-300"
                  style={{
                    height: `${(value / maxValue) * 100}%`,
                    minHeight: value > 0 ? '2px' : '0',
                    background: getBarGradient(value, index, index <= currentIndex),
                    boxShadow: isPeak(value) ? '0 0 6px rgba(255, 215, 0, 0.3)' : 'none',
                  }}
                />
              ))}
            </div>

            {/* 滑块轨道 */}
            <div className="absolute inset-0 flex items-center">
              <input
                type="range"
                min="0"
                max={timeSlots.length > 0 ? timeSlots.length - 1 : 0}
                value={currentIndex}
                onChange={handleSliderChange}
                className="w-full h-1.5 bg-transparent appearance-none cursor-pointer z-10 slider-timeline"
                style={{
                  background: `linear-gradient(90deg, rgba(0, 240, 255, 0.5) 0%, rgba(0, 240, 255, 0.5) ${(currentIndex / (TIME_SLOTS.length - 1)) * 100}%, transparent ${(currentIndex / (TIME_SLOTS.length - 1)) * 100}%, transparent 100%)`,
                }}
              />
            </div>

            {/* 时间刻度 - 动态显示 */}
            <div className="absolute -bottom-3 left-0 right-0 flex justify-between text-[9px] text-white/30">
              {timeSlots.filter((_, i) => i % Math.ceil(timeSlots.length / 5) === 0 || i === timeSlots.length - 1).slice(0, 5).map((time, i) => (
                <span key={i}>{time}</span>
              ))}
            </div>
          </div>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-10 bg-white/10 mx-3" />

        {/* 5. 当前动态数值区 */}
        <div className="w-[100px] shrink-0 text-right">
          <div className="text-[10px] text-white/40">当前{currentMetricConfig.label}</div>
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-2xl font-din text-white">{currentValue.toFixed(1)}</span>
            <span className="text-xs text-white/60">{currentMetricConfig.unit}</span>
          </div>
        </div>
      </div>

      <style>{`
        .slider-timeline::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #00F0FF;
          border: 2px solid #fff;
          box-shadow: 0 0 8px rgba(0, 240, 255, 0.6);
          cursor: pointer;
        }
        .slider-timeline::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #00F0FF;
          border: 2px solid #fff;
          box-shadow: 0 0 8px rgba(0, 240, 255, 0.6);
          cursor: pointer;
        }
        .scrollbar-cyber::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-cyber::-webkit-scrollbar-track {
          background: rgba(0, 240, 255, 0.05);
        }
        .scrollbar-cyber::-webkit-scrollbar-thumb {
          background: rgba(0, 240, 255, 0.3);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
