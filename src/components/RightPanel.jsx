import { motion } from 'framer-motion';
import { Train, Car, Plane, TrendingUp, MapPin } from 'lucide-react';

// 图标映射
const ICON_MAP = {
  '地铁站': Train,
  '高铁站': Train,
  '火车站': Train,
  '机场': Plane,
  '汽车站': Car,
  'default': Train,
};

export default function RightPanel({ p0Data, isLoading }) {
  // 从 p0Data 获取交通枢纽和文旅数据
  const transportRank = p0Data?.transport_rank || [];
  const tourismRank = p0Data?.tourism_rank || [];

  // 转换交通枢纽数据
  const transportData = transportRank.slice(0, 5).map((item, index) => {
    const pressure = item.transport_pressure_index || 0;
    const today = item.transport_current_traffic || 0;
    const normal = item.transport_baseline || 1;
    
    return {
      name: item.transport_poi_name || `交通枢纽${index + 1}`,
      icon: ICON_MAP['default'],
      pressure: pressure,
      today: today >= 10000 ? `${(today / 10000).toFixed(1)}万` : today.toString(),
      normal: normal >= 10000 ? `${(normal / 10000).toFixed(1)}万` : normal.toString(),
      status: pressure > 150 ? 'high' : pressure > 100 ? 'medium' : 'low',
    };
  });

  // 转换文旅数据
  const tourismData = tourismRank.slice(0, 5).map((item, index) => ({
    name: item.tourism_poi_name || `景点${index + 1}`,
    visitors: item.tourism_current_traffic || 0,
    pressure: item.tourism_pressure_index || 0,
    rank: index + 1,
  }));

  return (
    <div className="w-[300px] h-full flex flex-col gap-4 p-4 z-10">
      {/* 交通枢纽压力监测 */}
      <motion.div 
        initial={{ x: 50, opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }} 
        transition={{ delay: 0.2 }}
        className="glass-panel rounded-xl p-4 corner-bracket"
      >
        <span className="corner-bl" /><span className="corner-br" />
        
        <div className="flex items-center gap-2 mb-4">
          <Train className="w-4 h-4 text-cyber-cyan" />
          <span className="text-sm font-medium text-white">交通枢纽压力监测</span>
        </div>

        <div className="space-y-3">
          {transportData.length > 0 ? transportData.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.name}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index }}
                className="p-3 rounded-lg bg-cyber-dark/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-white/50" />
                    <span className="text-sm text-white">{item.name}</span>
                  </div>
                  <span className={`text-xs font-din ${
                    item.status === 'high' ? 'text-cyber-red' : 'text-cyber-gold'
                  }`}>
                    {item.pressure.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-white/40">今日 </span>
                    <span className="text-white font-din">{item.today}</span>
                  </div>
                  <div>
                    <span className="text-white/40">平日 </span>
                    <span className="text-white/60">{item.normal}</span>
                  </div>
                </div>

                <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((item.pressure / 3) * 100, 100)}%` }}
                    transition={{ delay: 0.2 + 0.1 * index, duration: 0.5 }}
                    className={`h-full rounded-full ${
                      item.status === 'high' 
                        ? 'bg-gradient-to-r from-red-500 to-red-400' 
                        : 'bg-gradient-to-r from-cyber-gold to-amber-400'
                    }`}
                  />
                </div>
              </motion.div>
            );
          }) : (
            <div className="text-center text-white/40 py-4">暂无交通数据</div>
          )}
        </div>
      </motion.div>

      {/* 文旅大数据分析 */}
      <motion.div 
        initial={{ x: 50, opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }} 
        transition={{ delay: 0.3 }}
        className="glass-panel rounded-xl p-4 corner-bracket flex-1"
      >
        <span className="corner-bl" /><span className="corner-br" />
        
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-cyber-gold" />
          <span className="text-sm font-medium text-white">文旅大数据分析</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-cyber-dark/50 text-center">
            <div className="text-xs text-white/40 mb-1">实时游客 (3天)</div>
            <div className="text-xl font-din text-cyber-cyan">8.6万</div>
          </div>
          <div className="p-3 rounded-lg bg-cyber-dark/50 text-center">
            <div className="text-xs text-white/40 mb-1">平均停留时长</div>
            <div className="text-xl font-din text-cyber-gold">26.5<span className="text-sm">小时</span></div>
          </div>
        </div>

        <div className="text-xs text-white/40 mb-2">热门打卡点 TOP5</div>
        <div className="space-y-2">
          {tourismData.length > 0 ? tourismData.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-center gap-3 p-2 rounded-lg bg-cyber-dark/30"
            >
              <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                item.rank === 1 ? 'bg-cyber-gold/20 text-cyber-gold' :
                item.rank === 2 ? 'bg-cyber-cyan/20 text-cyber-cyan' :
                item.rank === 3 ? 'bg-blue-500/20 text-blue-400' :
                'bg-white/10 text-white/50'
              }`}>
                {item.rank}
              </span>
              <span className="flex-1 text-sm text-white truncate">{item.name}</span>
              <span className="text-xs font-din text-white">
                {item.visitors >= 10000 ? `${(item.visitors / 10000).toFixed(1)}万` : item.visitors}
              </span>
              <span className={`text-[10px] ${
                item.pressure > 150 ? 'text-cyber-red' : 'text-cyber-gold'
              }`}>
                {item.pressure.toFixed(0)}
              </span>
            </motion.div>
          )) : (
            <div className="text-center text-white/40 py-4">暂无文旅数据</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
