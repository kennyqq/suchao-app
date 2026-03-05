import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import TimelineV3 from './components/TimelineV3';

// P0 宏观溯源
import LeftPanelP0 from './components/LeftPanel';
import RightPanelP0 from './components/RightPanel';
import MacroMigrationMap from './components/MacroMigrationMap';

// P0 API
import { fetchP0TimelineIndex, fetchP0Data, getDefaultTimePoint } from './api/p0';

// P1 全局防御 (V1)
import LeftPanelP1 from './pages/P1/LeftPanelP1';
import RightPanelP1 from './pages/P1/RightPanelP1';
import AmapL7Scene from './pages/P1/AmapL7Scene';

// P1 全局防御 V2 (数据契约重构版)
import GlobalDefenseV2 from './pages/P1/GlobalDefense.v2.jsx';

// P2 场内微观
import VenueMicro from './pages/P2/VenueMicro';

// P3 评估闭环
import EvaluationView from './pages/P3/EvaluationView';

// P0 宏观溯源视图
function MacroOriginView() {
  // 状态管理
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
    }, 2000);
    
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

  // 处理日期变化
  const handleDateChange = useCallback(async (dateStr) => {
    if (!timelineIndex) return;
    
    try {
      setIsLoading(true);
      const slots = timelineIndex.timeSlots[dateStr] || [];
      if (slots.length === 0) return;
      
      const newTimePoint = {
        date: dateStr,
        time: slots[slots.length - 1],
        formatted: `${dateStr} ${slots[slots.length - 1]}`
      };
      
      setCurrentTimePoint(newTimePoint);
      setCurrentIndex(slots.length - 1);
      
      const data = await fetchP0Data(dateStr, newTimePoint.time);
      setCurrentData(data);
    } catch (err) {
      console.error('[P0] 切换日期失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timelineIndex]);

  // 🚑 致命调试：确认数据是否到达
  console.log('====== 🚑 P0 真实接收到的状态数据 ======', currentData);
  console.log('====== 🚑 timelineIndex 状态 ======', timelineIndex);
  
  // ⚠️ 注意：fetchP0Data 已经返回 result.data，所以 currentData 本身就是业务数据
  // 不需要再 .data 解包！
  const p0Data = currentData;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 flex overflow-hidden pb-20">
        <LeftPanelP0 
          p0Data={p0Data} 
          isLoading={isLoading}
          currentTimePoint={currentTimePoint}
        />
        <div className="flex-1 flex flex-col relative py-2">
          <div className="text-center mb-1 flex-shrink-0">
            <div className="text-cyber-gold text-lg font-bold tracking-[0.3em]" style={{ textShadow: '0 0 20px rgba(255, 215, 0, 0.5)' }}>
              "一张网，火一座城"
            </div>
            {currentTimePoint && (
              <div className="text-white/50 text-xs mt-1">
                {currentTimePoint.formatted}
              </div>
            )}
          </div>
          <div className="flex-1 relative mx-2 min-h-0">
            <div className="absolute inset-0 rounded-xl overflow-visible border border-cyber-cyan/20 corner-bracket">
              <span className="corner-bl" />
              <span className="corner-br" />
              <MacroMigrationMap 
                p0Data={p0Data}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
        <RightPanelP0 
          p0Data={p0Data}
          isLoading={isLoading}
        />
      </div>
      
      {/* 底部时间轴 */}
      <TimelineV3 
        timelineIndex={timelineIndex}
        currentTimePoint={currentTimePoint}
        currentIndex={currentIndex}
        isPlaying={isPlaying}
        onTimeChange={handleTimeChange}
        onDateChange={handleDateChange}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}

// P1 全局防御 - 测试版（不含地图）
function GlobalDefense() {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="relative z-10 flex flex-col h-full pb-20">
        <div className="flex-1 flex overflow-hidden">
          <LeftPanelP1 />
          
          {/* 中央3D地图 */}
          <div className="flex-1 flex flex-col relative">
            <div className="text-center py-3">
              <div className="text-cyan-400 text-xl font-bold tracking-[0.4em]">
                "看得清态势，防得住隐患"
              </div>
            </div>
            <div className="flex-1 relative mx-3 rounded-2xl overflow-hidden border border-cyan-400/20">
              <AmapL7Scene />
            </div>
          </div>
          
          <RightPanelP1 />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="w-full h-screen bg-cyber-bg overflow-hidden flex flex-col relative">
        <Header />
        <div className="flex-1 relative">
          <Routes>
            <Route path="/" element={<MacroOriginView />} />
            <Route path="/p0" element={<MacroOriginView />} />
            <Route path="/p1" element={<GlobalDefense />} />
            <Route path="/p1/v2" element={<GlobalDefenseV2 />} />
            <Route path="/p2" element={<VenueMicro />} />
            <Route path="/p3" element={<EvaluationView />} />
          </Routes>
        </div>
        {/* 底部导航条 - 固定在底部 */}
        <div className="absolute bottom-0 w-full z-[100]">
          <TimelineV3 />
        </div>
      </div>
    </Router>
  );
}
