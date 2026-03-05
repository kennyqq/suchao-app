import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, MapPin } from 'lucide-react';
import CountUp from 'react-countup';

// 倒计时组件
function CountdownCard() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0 });

  useEffect(() => {
    const targetDate = new Date('2026-04-11T19:30:00');
    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate - now;
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        });
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ x: -50, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      transition={{ delay: 0.2 }}
      className="glass-panel rounded-xl p-4 corner-bracket"
    >
      <span className="corner-bl" /><span className="corner-br" />
      
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-cyber-gold" />
        <span className="text-xs text-white/50">距离苏超开幕</span>
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-din text-cyber-gold">{timeLeft.days}</span>
        <span className="text-sm text-white/60">天</span>
        <span className="text-3xl font-din text-cyber-gold ml-2">{timeLeft.hours}</span>
        <span className="text-sm text-white/60">小时</span>
      </div>
    </motion.div>
  );
}

// 文旅指数卡片
function TourismIndexCard({ p0Data }) {
  const drainageIndex = p0Data?.drainage_index ?? 0;
  const outsiderCount = p0Data?.realtime_outsider_count ?? 0;
  
  return (
    <motion.div 
      initial={{ x: -50, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      transition={{ delay: 0.3 }}
      className="glass-panel rounded-xl p-4 corner-bracket"
    >
      <span className="corner-bl" /><span className="corner-br" />
      
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-cyber-cyan" />
        <span className="text-xs text-white/50">城市文旅引流指数</span>
      </div>
      
      <div className="flex items-baseline gap-2">
        <CountUp end={drainageIndex} duration={2} className="text-3xl font-din text-white" />
        <span className="text-sm text-white/60">指数</span>
      </div>
      
      <div className="mt-2 flex items-center gap-2">
        <span className="text-cyber-cyan text-sm font-medium">
          {outsiderCount.toLocaleString()}
        </span>
        <span className="text-xs text-white/40">实时外来客流</span>
      </div>

      {/* 公式说明 */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="text-[10px] text-white/30">
          公式：当日外地访客 ÷ 平日基准 × 100
        </div>
      </div>
    </motion.div>
  );
}

// TOP8 城市列表
function TopCitiesList({ p0Data }) {
  const [activeTab, setActiveTab] = useState('national');
  
  // 从 p0Data 获取动态数据
  const outProvinceRank = p0Data?.out_province_rank || [];
  const inProvinceRank = p0Data?.in_province_rank || [];
  
  // 转换为组件需要的格式
  const cities = {
    national: outProvinceRank.slice(0, 8).map(item => ({
      name: item.out_province_city_name,
      value: item.out_province_visitor_count
    })),
    jiangsu: inProvinceRank.slice(0, 8).map(item => ({
      name: item.in_province_city_name,
      value: item.in_province_visitor_count
    })),
  };

  // 如果没有数据，使用空数组
  const currentCities = cities[activeTab].length > 0 ? cities[activeTab] : 
    (activeTab === 'national' ? [
      { name: '暂无数据', value: 0 },
    ] : [
      { name: '暂无数据', value: 0 },
    ]);
  
  const maxValue = Math.max(...currentCities.map(c => c.value), 1); // 避免除以0

  return (
    <motion.div 
      initial={{ x: -50, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      transition={{ delay: 0.4 }}
      className="glass-panel rounded-xl p-4 corner-bracket flex-1 flex flex-col min-h-0"
    >
      <span className="corner-bl" /><span className="corner-br" />
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyber-gold" />
          <span className="text-sm font-medium text-white">球迷来源地 TOP8</span>
        </div>
        
        <div className="flex gap-1">
          <button 
            onClick={() => setActiveTab('national')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              activeTab === 'national' 
                ? 'bg-cyber-gold text-cyber-bg' 
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            全国
          </button>
          <button 
            onClick={() => setActiveTab('jiangsu')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              activeTab === 'jiangsu' 
                ? 'bg-cyber-cyan text-cyber-bg' 
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            省内
          </button>
        </div>
      </div>

      <div className="space-y-2 overflow-y-auto scrollbar-cyber flex-1">
        {currentCities.map((city, index) => (
          <motion.div
            key={city.name}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.05 * index }}
            className="flex items-center gap-3"
          >
            <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
              index < 3 ? 'bg-cyber-gold/20 text-cyber-gold' : 'bg-white/10 text-white/50'
            }`}>
              {index + 1}
            </span>
            <span className="w-12 text-sm text-white">{city.name}</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(city.value / maxValue) * 100}%` }}
                transition={{ delay: 0.1 + 0.05 * index, duration: 0.5 }}
                className="h-full rounded-full bg-gradient-to-r from-cyber-gold to-amber-500"
              />
            </div>
            <span className="text-xs font-din text-white/70 w-12 text-right">
              {(city.value / 1000).toFixed(1)}k
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function LeftPanel({ p0Data, isLoading, currentTimePoint }) {
  return (
    <div className="w-[300px] h-full flex flex-col gap-4 p-4 z-10">
      <CountdownCard />
      <TourismIndexCard p0Data={p0Data} />
      <TopCitiesList p0Data={p0Data} />
    </div>
  );
}
