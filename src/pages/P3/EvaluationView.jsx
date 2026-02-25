import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Crown, Package, Upload, Smartphone, ChevronRight, Sparkles, BarChart3, Target } from 'lucide-react';
import BattleReportCard from './components/BattleReportCard';
import UplinkTrendChart from './components/UplinkTrendChart';
import VIPComparisonChart from './components/VIPComparisonChart';
import AgentContribution from './components/AgentContribution';
import CyberBorder from '../../components/CyberBorder';

// 核心价值用户数据
const vipMetrics = [
  { 
    label: '钻白卡用户', 
    sublabel: '重保VIP',
    value: '3,241', 
    unit: '人', 
    icon: Crown,
    color: '#E5E4E2',
    bgColor: 'from-gray-300/20 to-gray-500/20',
    borderColor: 'border-gray-400/30'
  },
  { 
    label: '5G-A场馆包', 
    sublabel: '销量',
    value: '850', 
    unit: '份', 
    icon: Package,
    color: '#FFD700',
    bgColor: 'from-yellow-400/20 to-yellow-600/20',
    borderColor: 'border-yellow-500/30'
  },
];

// VIP赛后关怀手机弹窗组件
function VIPCareNotification() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative mx-auto w-full max-w-[220px]"
    >
      {/* 手机外框 */}
      <div className="bg-gray-800 rounded-[20px] p-1.5 border border-gray-600 shadow-2xl">
        {/* 手机屏幕 */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-[14px] p-2.5 relative overflow-hidden">
          {/* 状态栏 */}
          <div className="flex items-center justify-between mb-2 text-[9px]">
            <span className="text-white/80">22:30</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-white/60">5G-A</span>
              <span className="text-white/60">85%</span>
            </div>
          </div>

          {/* 通知卡片 */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="bg-gradient-to-br from-indigo-900/60 to-purple-900/40 rounded-lg p-2.5 border border-white/10"
          >
            {/* 应用图标和标题 */}
            <div className="flex items-start gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-white/90 text-[10px] font-medium">江苏移动</span>
                  <span className="text-white/40 text-[8px]">测试</span>
                </div>
                <div className="text-white text-[11px] font-semibold leading-tight">
                  尊贵的钻白卡用户
                </div>
              </div>
            </div>
            
            {/* 主体描述 */}
            <div className="text-white/70 text-[9px] leading-relaxed mb-2">
              昨晚智能体为您的 <span className="text-cyan-400 font-medium">微信视频/直播</span> 业务进行了专属加速 🚀
            </div>
            
            {/* 高亮金句 */}
            <div className="inline-flex items-center gap-1 bg-yellow-500/15 rounded px-1.5 py-0.5 border border-yellow-500/20">
              <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
              <span className="text-yellow-400 text-[8px] font-medium">
                您的体验超越了现场 <span className="text-yellow-300 font-bold">99%</span> 的用户
              </span>
            </div>

            {/* 底部交互 */}
            <div className="flex items-center justify-end mt-2 pt-1.5 border-t border-white/5">
              <button className="flex items-center gap-0.5 text-cyan-400 text-[9px] hover:text-cyan-300 transition-colors">
                查看详情
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>

          {/* 底部 home indicator */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-white/20 rounded-full" />
        </div>
      </div>

      {/* 装饰光效 */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400/40 rounded-full blur-sm" />
    </motion.div>
  );
}

export default function EvaluationView() {
  const [showReport, setShowReport] = useState(true);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-cyber-bg">
      {/* 背景效果 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] opacity-20" 
          style={{ background: 'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 50%)' }} 
        />
      </div>

      {/* 中间内容区 */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        
        {/* ========== 左侧：经营变现与赛后关怀 ========== */}
        <div className="absolute left-6 top-6 bottom-6 w-80 flex flex-col gap-4">
          
          {/* 面板标题 */}
          <div className="flex items-center gap-2 px-1 flex-shrink-0">
            <div className="w-1 h-5 bg-yellow-500 rounded-full" />
            <div>
              <h2 className="text-sm font-bold text-yellow-400">经营变现与赛后关怀</h2>
              <p className="text-[9px] text-white/40 uppercase tracking-wider">Post-Match Care</p>
            </div>
          </div>

          {/* 模块1: 核心价值用户 */}
          <CyberBorder delay={0.1} className="flex-shrink-0">
            <div className="glass-panel rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded bg-yellow-500/20 flex items-center justify-center">
                  <Crown className="w-3 h-3 text-yellow-400" />
                </div>
                <h3 className="text-white font-bold text-xs">核心价值用户</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/30 to-transparent ml-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {vipMetrics.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-2.5 rounded-lg bg-gradient-to-br ${item.bgColor} border ${item.borderColor}`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <item.icon className="w-3 h-3" style={{ color: item.color }} />
                      <span className="text-white/70 text-[10px]">{item.label}</span>
                    </div>
                    <div className="text-white/50 text-[9px] mb-0.5">{item.sublabel}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold font-orbitron" style={{ color: item.color }}>
                        {item.value}
                      </span>
                      <span className="text-white/60 text-xs">{item.unit}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </CyberBorder>

          {/* 模块2: 现场上行流量趋势 */}
          <CyberBorder delay={0.2} className="flex-shrink-0">
            <div className="glass-panel rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded bg-cyan-500/20 flex items-center justify-center">
                  <Upload className="w-3 h-3 text-cyan-400" />
                </div>
                <h3 className="text-white font-bold text-xs">现场上行流量趋势</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 to-transparent ml-2" />
              </div>
              
              <div className="mb-2">
                <div className="text-white/50 text-[9px] mb-0.5">用户分享活跃度</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-cyan-400 font-orbitron">Peak: 4.2</span>
                  <span className="text-cyan-400 text-xs">Gbps</span>
                </div>
              </div>
              
              <div className="h-[80px]">
                <UplinkTrendChart />
              </div>
              
              <div className="mt-1 text-center">
                <span className="text-white/40 text-[9px]">峰值时刻: 20:45 (进球时刻)</span>
              </div>
            </div>
          </CyberBorder>

          {/* 模块3: VIP赛后关怀（手机弹窗）- 填充剩余空间 */}
          <CyberBorder delay={0.3} className="flex-1 min-h-0">
            <div className="glass-panel rounded-lg p-3 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center">
                  <Smartphone className="w-3 h-3 text-green-400" />
                </div>
                <h3 className="text-white font-bold text-xs">VIP 赛后关怀</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-green-500/30 to-transparent ml-2" />
              </div>
              
              <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
                <VIPCareNotification />
              </div>
            </div>
          </CyberBorder>
        </div>

        {/* ========== C位：战报弹窗（偏上、加宽、金色质感） ========== */}
        <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 z-20">
          <AnimatePresence>
            {showReport && (
              <BattleReportCard onClose={() => setShowReport(false)} />
            )}
          </AnimatePresence>

          {!showReport && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowReport(true)}
              className="glass-panel-gold rounded-xl px-6 py-3 text-cyber-gold hover:bg-cyber-gold/10 transition-colors flex items-center gap-2"
            >
              <Trophy className="w-5 h-5" />
              查看战报
            </motion.button>
          )}
        </div>

        {/* ========== 右侧：分层体验与智能体贡献 ========== */}
        <div 
          className="absolute right-6 top-6 bottom-6 w-80 flex flex-col gap-6 pb-32 overflow-y-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* 隐藏滚动条样式 */}
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {/* 面板标题 */}
          <div className="flex items-center gap-2 px-1 flex-shrink-0">
            <div className="w-1 h-5 bg-cyan-500 rounded-full" />
            <div>
              <h2 className="text-sm font-bold text-cyan-400">分层体验与智能体贡献</h2>
              <p className="text-[9px] text-white/40 uppercase tracking-wider">VIP Experience</p>
            </div>
          </div>

          {/* 模块1: VIP vs 普通用户对比 */}
          <CyberBorder delay={0.1} className="flex-shrink-0">
            <div className="glass-panel rounded-lg p-3 flex flex-col">
              <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                <div className="w-5 h-5 rounded bg-yellow-500/20 flex items-center justify-center">
                  <BarChart3 className="w-3 h-3 text-yellow-400" />
                </div>
                <h3 className="text-white font-bold text-xs">VIP vs 普通用户体验对比</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/30 to-transparent ml-2" />
              </div>
              
              <div className="text-white/40 text-[9px] mb-2 flex-shrink-0">实测数据对比</div>
              
              <div className="h-[200px] flex-shrink-0">
                <VIPComparisonChart />
              </div>
            </div>
          </CyberBorder>

          {/* 模块2: 智能体贡献 */}
          <CyberBorder delay={0.2} className="flex-shrink-0">
            <div className="glass-panel rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center">
                  <Target className="w-3 h-3 text-purple-400" />
                </div>
                <h3 className="text-white font-bold text-xs">智能体贡献</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-purple-500/30 to-transparent ml-2" />
              </div>
              
              <AgentContribution />
            </div>
          </CyberBorder>

          {/* 模块3: 持续优化建议 */}
          <CyberBorder delay={0.3} className="flex-shrink-0">
            <div className="glass-panel rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                <div className="w-5 h-5 rounded bg-orange-500/20 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-orange-400" />
                </div>
                <h3 className="text-white font-bold text-xs">持续优化建议</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-orange-500/30 to-transparent ml-2" />
              </div>
              
              <div className="space-y-1.5">
                {[
                  { num: '1', title: '南看台F区扩容', desc: '建议增加2个4T4R小区' },
                  { num: '2', title: 'VIP专席保障优化', desc: '下一场提前15分钟预激活' },
                  { num: '3', title: '上行干扰排查', desc: '西区存在外部干扰源' },
                ].map((item) => (
                  <div key={item.num} className="flex items-start gap-2 p-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="w-4 h-4 rounded bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-400 text-[9px]">{item.num}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white/80 text-[10px] truncate">{item.title}</div>
                      <div className="text-white/40 text-[9px] truncate">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CyberBorder>
        </div>
      </div>
    </div>
  );
}
