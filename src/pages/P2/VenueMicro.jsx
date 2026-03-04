/**
 * P2 场内微观视图 - 主容器组件
 * 
 * 功能：
 * 1. 从BFF获取真实数据（15秒轮询）
 * 2. 管理全局状态（数据、加载状态、当前时间）
 * 3. 将数据分发到左/右/中三个面板
 * 4. 统一错误处理和loading状态
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, WifiOff } from 'lucide-react';
import TimelineV3 from '../../components/TimelineV3';
import LeftPanelP2 from './LeftPanelP2';
import RightPanelP2 from './RightPanelP2';
import CenterStage from './CenterStage';
import { fetchP2IndoorMicroData } from '../../api/p2';

// ========== 加载动画组件 ==========
function LoadingOverlay() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-cyber-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="w-12 h-12 text-cyber-cyan" />
      </motion.div>
      <div className="mt-4 text-cyber-cyan font-din text-lg">加载数据中...</div>
      <div className="mt-2 text-white/40 text-sm">连接 BFF 服务 localhost:3000</div>
    </motion.div>
  );
}

// ========== 错误提示组件 ==========
function ErrorOverlay({ error, onRetry }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-cyber-black/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
    >
      <WifiOff className="w-16 h-16 text-red-400 mb-4" />
      <div className="text-red-400 font-din text-xl mb-2">数据获取失败</div>
      <div className="text-white/60 text-sm mb-6 max-w-md text-center">
        {error || '无法连接到 BFF 服务，请确保后端服务已启动 (npm run bff)'}
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-6 py-3 bg-cyber-cyan/20 border border-cyber-cyan/50 rounded-lg text-cyber-cyan hover:bg-cyber-cyan/30 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        重试连接
      </button>
    </motion.div>
  );
}

// ========== 主组件 ==========
export default function VenueMicro() {
  // ========== 状态定义 ==========
  const [p2GlobalData, setP2GlobalData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentTime, setCurrentTime] = useState('20:00');
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  
  // 使用 ref 存储 interval，避免依赖问题
  const intervalRef = useRef(null);

  // ========== 数据获取 ==========
  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setIsError(false);
    
    try {
      const data = await fetchP2IndoorMicroData('南看台F区');
      
      // API直接返回数据对象（包含fallback机制）
      if (data) {
        setP2GlobalData(data);
        setLastUpdateTime(new Date());
        console.log('[P2] 数据已更新:', new Date().toLocaleTimeString(), '来源:', data.meta?.dataSource || 'unknown');
      } else {
        throw new Error('返回数据为空');
      }
    } catch (error) {
      console.error('[P2] 数据获取失败:', error);
      setIsError(true);
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ========== 初始加载 + 轮询 ==========
  useEffect(() => {
    // 初始加载
    fetchData(true);
    
    // 15秒轮询
    intervalRef.current = setInterval(() => {
      fetchData(false); // 轮询时不显示loading，静默更新
    }, 15000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData]);

  // ========== 时间轴变化处理 ==========
  const handleTimeChange = useCallback((timeData) => {
    setCurrentTime(timeData.time);
    // 时间变化时立即刷新数据
    fetchData(false);
  }, [fetchData]);

  // ========== 手动刷新 ==========
  const handleRetry = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      {/* ========== Loading/Error 遮罩 ========== */}
      <AnimatePresence>
        {isLoading && !p2GlobalData && <LoadingOverlay />}
        {isError && !p2GlobalData && (
          <ErrorOverlay error={errorMsg} onRetry={handleRetry} />
        )}
      </AnimatePresence>

      {/* ========== 主内容区 ========== */}
      <div className="relative z-10 flex flex-col h-full pb-24">
        {/* 中部内容区 - 绝对定位布局 */}
        <div className="flex-1 relative">
          {/* 中央场馆舞台 - 底层背景 */}
          <div className="absolute inset-0">
            <CenterStage data={p2GlobalData} />
          </div>

          {/* 左侧面板 - 悬浮 */}
          <div className="absolute left-0 top-0 bottom-32 w-[320px] z-10 p-4">
            <LeftPanelP2 data={p2GlobalData} isLoading={isLoading} />
          </div>

          {/* 右侧面板 - 悬浮 */}
          <div className="absolute right-0 top-0 bottom-32 w-[320px] z-10 p-4">
            <RightPanelP2 data={p2GlobalData} isLoading={isLoading} />
          </div>
          
          {/* 数据更新时间戳 */}
          {lastUpdateTime && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-white/30"
            >
              最后更新: {lastUpdateTime.toLocaleTimeString()}
              {isLoading && <span className="ml-2 text-cyber-cyan">[更新中...]</span>}
            </motion.div>
          )}
        </div>
      </div>

      {/* ========== 底部全局时间轴 ========== */}
      <TimelineV3 
        onTimeChange={handleTimeChange}
        externalTime={currentTime}
      />
    </div>
  );
}
