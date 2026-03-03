import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import TimelineV3 from './components/TimelineV3';

// P0 宏观溯源
import LeftPanelP0 from './components/LeftPanel';
import RightPanelP0 from './components/RightPanel';
import MacroMigrationMap from './components/MacroMigrationMap';

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
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 flex overflow-hidden pb-20">
        <LeftPanelP0 />
        <div className="flex-1 flex flex-col relative py-2">
          <div className="text-center mb-1 flex-shrink-0">
            <div className="text-cyber-gold text-lg font-bold tracking-[0.3em]" style={{ textShadow: '0 0 20px rgba(255, 215, 0, 0.5)' }}>
              "一张网，火一座城"
            </div>
          </div>
          <div className="flex-1 relative mx-2 min-h-0">
            <div className="absolute inset-0 rounded-xl overflow-visible border border-cyber-cyan/20 corner-bracket">
              <span className="corner-bl" />
              <span className="corner-br" />
              <MacroMigrationMap />
            </div>
          </div>
        </div>
        <RightPanelP0 />
      </div>
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
