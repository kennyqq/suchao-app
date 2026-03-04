/**
 * P2 场内微观视图 - BFF 真实接口版
 * 
 * 改造点：
 * 1. 删除静态Mock数据
 * 2. 接入BFF真实API
 * 3. 15秒轮询刷新
 * 4. 全局状态通过props分发给子组件
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchP2IndoorMicroData, fetchP2Zones } from '../api/p2';

// 子组件
import LeftPanelP2 from '../pages/P2/LeftPanelP2';
import RightPanelP2 from '../pages/P2/RightPanelP2';
import CenterStage from '../pages/P2/CenterStage';
import TimelineV3 from '../components/TimelineV3';

// 科技感 Loading 组件
function CyberLoading() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-cyber-bg/95"
    >
      <div className="relative">
        {/* 外圈发光环 */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 rounded-full border-2 border-cyber-cyan/30 border-t-cyber-cyan"
        />
        
        {/* 内圈反向旋转 */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 rounded-full border-2 border-cyber-gold/30 border-b-cyber-gold"
        />
        
        {/* 中心脉冲 */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-cyber-cyan/20"
        />
        
        {/* 文字 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-cyber-cyan text-sm font-medium">LOADING</span>
        </div>
        
        {/* 扫描线 */}
        <motion.div
          animate={{ y: [-64, 64] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-cyan to-transparent"
        />
      </div>
      
      <div className="absolute bottom-1/3 text-center">
        <div className="text-cyber-cyan/60 text-xs tracking-widest">正在连接BFF中台...</div>
        <div className="text-white/40 text-[10px] mt-2">http://localhost:3000</div>
      </div>
    </motion.div>
  );
}

export default function P2() {
  // 当前选中的防线区
  const [currentZone, setCurrentZone] = useState('南看台F区');
  
  // 全局数据状态
  const [p2GlobalData, setP2GlobalData] = useState(null);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  
  // 错误状态
  const [error, setError] = useState(null);
  
  // 区域列表
  const [zones, setZones] = useState([]);
  
  // 轮询定时器引用
  const pollIntervalRef = useRef(null);
  
  /**
   * 获取P2数据
   */
  const loadP2Data = async (zoneName = currentZone, showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const data = await fetchP2IndoorMicroData(zoneName);
      setP2GlobalData(data);
      console.log('[P2 View] 数据更新成功:', zoneName);
    } catch (err) {
      console.error('[P2 View] 数据加载失败:', err);
      setError(err.message);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };
  
  /**
   * 加载区域列表
   */
  const loadZones = async () => {
    try {
      const zoneList = await fetchP2Zones();
      setZones(zoneList);
    } catch (err) {
      console.error('[P2 View] 加载区域列表失败:', err);
    }
  };
  
  /**
   * 切换防线区
   */
  const handleZoneChange = (zoneName) => {
    setCurrentZone(zoneName);
    loadP2Data(zoneName, true);
  };
  
  // 组件挂载：初始化数据并启动轮询
  useEffect(() => {
    console.log('[P2 View] 组件挂载，初始化数据...');
    
    // 立即加载一次数据（显示Loading）
    loadP2Data(currentZone, true);
    loadZones();
    
    // 设置15秒轮询
    pollIntervalRef.current = setInterval(() => {
      console.log('[P2 View] 轮询刷新数据...');
      loadP2Data(currentZone, false); // 不显示Loading，静默刷新
    }, 15000);
    
    // 清理函数
    return () => {
      console.log('[P2 View] 组件卸载，清理轮询...');
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);
  
  // currentZone变化时重新加载
  useEffect(() => {
    if (p2GlobalData) {
      loadP2Data(currentZone, true);
    }
  }, [currentZone]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      {/* Loading 动画 */}
      <AnimatePresence>
        {isLoading && <CyberLoading />}
      </AnimatePresence>
      
      {/* 主内容区 */}
      <div className="relative z-10 flex flex-col h-full pb-24">
        {/* 顶部区域选择器 */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 bg-cyber-dark/80 backdrop-blur rounded-lg px-4 py-2 border border-cyber-cyan/30">
            <span className="text-white/60 text-sm">当前区域:</span>
            <select 
              value={currentZone}
              onChange={(e) => handleZoneChange(e.target.value)}
              className="bg-transparent text-cyber-cyan text-sm outline-none cursor-pointer"
            >
              {zones.map(zone => (
                <option key={zone.name} value={zone.name} className="bg-cyber-dark">
                  {zone.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* 中部内容区 - 绝对定位布局 */}
        <div className="flex-1 relative">
          {/* 中央场馆舞台 - 底层背景 */}
          <div className="absolute inset-0">
            <CenterStage zoneName={currentZone} />
          </div>

          {/* 左侧面板 - 悬浮 */}
          <div className="absolute left-0 top-0 bottom-32 w-[320px] z-10 p-4">
            <LeftPanelP2 
              data={p2GlobalData}
              isLoading={isLoading}
            />
          </div>

          {/* 右侧面板 - 悬浮 */}
          <div className="absolute right-0 top-0 bottom-32 w-[320px] z-10 p-4">
            <RightPanelP2 
              data={p2GlobalData}
              isLoading={isLoading}
            />
          </div>
          
          {/* 数据更新时间戳 */}
          {p2GlobalData && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-white/30">
              数据更新时间: {new Date().toLocaleTimeString()} | 15秒自动刷新
            </div>
          )}
        </div>
      </div>

      {/* 底部全局时间轴 */}
      <TimelineV3 />
    </div>
  );
}
