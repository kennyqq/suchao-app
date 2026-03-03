/**
 * GlobalDefense V2 - 基于 V2 数据契约重构
 * 核心改进：
 * 1. 使用 LeftPanelP1V2, RightPanelP1V2, AmapL7SceneV2
 * 2. Store V2 数据字典缓存
 * 3. 告警联动：cell_id → 字典查询 → 地图动画
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AmapL7SceneV2 from './AmapL7Scene.v2.jsx';
import LeftPanelP1V2 from './LeftPanelP1.v2.jsx';
import RightPanelP1V2 from './RightPanelP1.v2.jsx';
import TimelineV3 from '../../components/TimelineV3';
import SiteDetailModal from './components/SiteDetailModal';
import useDashboardStore from '../../store/useDashboardStore.js';

export default function GlobalDefenseV2() {
  const [selectedStation, setSelectedStation] = useState(null);
  const [currentTime, setCurrentTime] = useState('20:00');
  const [selectedMetric, setSelectedMetric] = useState('crowd');

  const handleStationClick = (station) => {
    setSelectedStation(station);
  };

  const handleCloseModal = () => {
    setSelectedStation(null);
  };

  const handleTimeChange = (timeData) => {
    setCurrentTime(timeData.time);
  };

  const handleMetricChange = (metric) => {
    setSelectedMetric(metric);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* 背景效果 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] opacity-20" 
          style={{ background: 'radial-gradient(circle, rgba(0, 240, 255, 0.1) 0%, transparent 50%)' }} 
        />
        <div className="absolute inset-0 opacity-[0.015]" 
          style={{ backgroundImage: `linear-gradient(rgba(0, 240, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 1) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} 
        />
      </div>

      {/* 主内容区 */}
      <div className="relative z-10 flex flex-col h-full pb-32">
        {/* 中部内容区 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧 - V2 面板 */}
          <LeftPanelP1V2 />

          {/* C位数字孪生地图 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex-1 flex flex-col relative"
          >
            {/* 顶部标语 */}
            <div className="text-center py-3">
              <motion.div 
                className="text-transparent text-xl font-bold tracking-[0.4em]"
                style={{ 
                  background: 'linear-gradient(90deg, #00F0FF 0%, #FFFFFF 50%, #00F0FF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 30px rgba(0, 240, 255, 0.3)',
                }}
              >
                "看得清态势，防得住隐患"
              </motion.div>
              <div className="decor-en">Situational Awareness & Risk Control (V2)</div>
            </div>

            {/* 地图容器 */}
            <div className="flex-1 relative mx-3 rounded-2xl overflow-hidden border border-cyber-cyan/20 corner-bracket" 
              style={{ boxShadow: '0 0 50px rgba(0, 240, 255, 0.1), inset 0 0 100px rgba(0, 240, 255, 0.03)' }}
            >
              {/* 四角装饰 */}
              <span className="absolute top-0 left-0 w-6 h-6 border-l border-t border-cyber-cyan/60 z-10" />
              <span className="absolute top-0 right-0 w-6 h-6 border-r border-t border-cyber-cyan/60 z-10" />
              <span className="absolute bottom-0 left-0 w-6 h-6 border-l border-b border-cyber-cyan/60 z-10" />
              <span className="absolute bottom-0 right-0 w-6 h-6 border-r border-b border-cyber-cyan/60 z-10" />
              
              {/* V2 地图组件 */}
              <AmapL7SceneV2 
                onStationClick={handleStationClick}
                currentTime={currentTime}
              />
            </div>
          </motion.div>

          {/* 右侧 - V2 面板 */}
          <RightPanelP1V2 />
        </div>
      </div>

      {/* 统一全功能导航条 */}
      <TimelineV3 
        onTimeChange={handleTimeChange}
        onMetricChange={handleMetricChange}
        externalTime={currentTime}
      />

      {/* 站点详情模态框 */}
      <SiteDetailModal 
        station={selectedStation} 
        onClose={handleCloseModal} 
      />
    </div>
  );
}
