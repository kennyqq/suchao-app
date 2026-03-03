/**
 * Dashboard 全局状态管理 V2
 * 使用 Zustand 实现，基于 V2 数据契约
 * 核心功能：数据字典缓存 + 前端计算指标
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  // V2 API 服务
  fetchMasterCellDimV2,
  fetchMasterUserDimV2,
  fetchHubPressureRealtimeV2,
  fetchCellPerfRealtimeV2,
  fetchKQIMetricRealtimeV2,
  fetchZoneUserAggV2,
  fetchAlertEventStreamV2,
  buildCellDictionaryV2,
  buildUserDictionaryV2,
  // V2 计算辅助函数
  calculatePressureRatio,
  calculateMoMChange,
  calculate5GAPenetration,
} from '../api/services/dashboard.v2.js';

// 兼容保留原有 API 用于过渡
import {
  fetchP0MigrationData,
  fetchP0TourismIndex,
  fetchP0TransportData,
  fetchP0TourismAnalysis,
  fetchP1FlowData,
  fetchP1OpLogs,
  fetchP2VenueData,
  fetchP3EvaluationData,
  fetchTimelineData,
} from '../api/services/dashboard.js';

/**
 * Dashboard Store V2
 * 核心改进：
 * 1. 数据字典缓存 (cellDict/userDict) 用于 O(1) 联表匹配
 * 2. 前端计算指标 (ratio, MoM, 5G-A 渗透率)
 * 3. 统一使用 V2 数据契约 (cell_id, lng/lat, timestamp)
 */
const useDashboardStore = create(
  devtools(
    persist(
      (set, get) => ({
        // ============================================
        // 全局状态
        // ============================================
        
        /** 当前视图模式: 'p0' | 'p1' | 'p2' | 'p3' */
        currentView: 'p0',
        
        /** 当前时间轴时间 (HH:mm) */
        currentTime: '20:00',
        
        /** 时间轴播放状态 */
        isTimelinePlaying: false,
        
        /** 当前选中的指标: 'crowd' | 'traffic' | 'fiveGA' */
        selectedMetric: 'crowd',
        
        /** 选中的日期 */
        selectedDate: null,
        
        /** 加载状态 */
        loading: {
          p0: false,
          p1: false,
          p2: false,
          p3: false,
          alerts: false,
        },
        
        /** 错误状态 */
        errors: {
          p0: null,
          p1: null,
          p2: null,
          p3: null,
          alerts: null,
        },

        // ============================================
        // V2 数据字典缓存 (核心改进)
        // ============================================
        
        /** 小区主数据字典 Map<cell_id, CellDimV2> */
        cellDictionary: new Map(),
        
        /** 用户主数据字典 Map<user_id, UserDimV2> */
        userDictionary: new Map(),
        
        /** 数据字典是否已加载 */
        isDictLoaded: false,

        // ============================================
        // V2 实时数据源
        // ============================================
        
        /** 小区性能实时数据 */
        cellPerfRealtime: [],
        
        /** KQI 指标实时数据 */
        kqiRealtime: [],
        
        /** 交通枢纽压力实时数据 */
        hubPressureRealtime: [],
        
        /** 区域用户聚合数据 */
        zoneUserAgg: [],
        
        /** 告警事件流 */
        alertEventStream: [],

        // ============================================
        // P0 - 宏观溯源数据 (兼容保留)
        // ============================================
        p0Data: {
          migration: null,
          tourismIndex: null,
          transport: null,
          tourismAnalysis: null,
        },

        // ============================================
        // P1 - 全局态势数据 (兼容保留)
        // ============================================
        p1Data: {
          global: null,
          kqi: null,
          flow: null,
          opLogs: null,
        },

        // ============================================
        // P2 - 场内微观数据 (兼容保留)
        // ============================================
        p2Data: {
          venue: null,
        },

        // ============================================
        // P3 - 评估闭环数据 (兼容保留)
        // ============================================
        p3Data: {
          evaluation: null,
        },

        // ============================================
        // 告警数据
        // ============================================
        alerts: [],
        
        /** 时间轴数据 */
        timelineData: null,

        // ============================================
        // Actions - V2 数据字典管理
        // ============================================

        /**
         * 初始化数据字典 (应用启动时调用)
         * 构建 Map<cell_id, CellDim> 和 Map<user_id, UserDim>
         */
        initDictionaries: async () => {
          try {
            const [cellDict, userDict] = await Promise.all([
              buildCellDictionaryV2(),
              buildUserDictionaryV2(),
            ]);
            set({ 
              cellDictionary: cellDict, 
              userDictionary: userDict,
              isDictLoaded: true,
            });
            console.log('[Store V2] 数据字典加载完成');
          } catch (error) {
            console.error('[Store V2] 数据字典加载失败:', error);
          }
        },

        /**
         * 通过 cell_id 查询小区详情 (O(1))
         * @param {string} cellId - 小区ID
         * @returns {CellDimV2 | undefined}
         */
        getCellById: (cellId) => {
          return get().cellDictionary.get(cellId);
        },

        /**
         * 通过 user_id 查询用户详情 (O(1))
         * @param {string} userId - 用户ID
         * @returns {UserDimV2 | undefined}
         */
        getUserById: (userId) => {
          return get().userDictionary.get(userId);
        },

        /**
         * 通过告警的 cell_id 查询经纬度
         * @param {string} cellId - 小区ID
         * @returns {{lng: number, lat: number} | null}
         */
        getCellCoordinates: (cellId) => {
          const cell = get().cellDictionary.get(cellId);
          if (cell) {
            return { lng: cell.lng, lat: cell.lat };
          }
          return null;
        },

        // ============================================
        // Actions - V2 数据获取
        // ============================================

        /**
         * 获取 V2 实时数据
         * 并行获取所有实时数据源
         */
        fetchV2RealtimeData: async () => {
          set(state => ({ loading: { ...state.loading, p1: true } }));
          try {
            const [cellPerf, kqi, hubPressure, alerts] = await Promise.all([
              fetchCellPerfRealtimeV2(),
              fetchKQIMetricRealtimeV2(),
              fetchHubPressureRealtimeV2(),
              fetchAlertEventStreamV2(),
            ]);
            set(state => ({
              cellPerfRealtime: cellPerf,
              kqiRealtime: kqi,
              hubPressureRealtime: hubPressure,
              alertEventStream: alerts,
              loading: { ...state.loading, p1: false },
            }));
          } catch (error) {
            console.error('[Store V2] 实时数据获取失败:', error);
            set(state => ({ loading: { ...state.loading, p1: false } }));
          }
        },

        /**
         * 获取 P2 场内微观数据
         */
        fetchP2ZoneData: async () => {
          try {
            const zoneData = await fetchZoneUserAggV2();
            set({ zoneUserAgg: zoneData });
          } catch (error) {
            console.error('[Store V2] 区域数据获取失败:', error);
          }
        },

        // ============================================
        // Actions - V2 计算指标 (前端计算)
        // ============================================

        /**
         * 获取带计算指标的 Cell 性能数据
         * @returns {Array<CellPerfComputedV2>}
         */
        getComputedCellPerf: () => {
          const { cellPerfRealtime, cellDictionary } = get();
          return cellPerfRealtime.map(perf => {
            const cell = cellDictionary.get(perf.cell_id);
            return {
              ...perf,
              // 关联字典获取静态信息
              cell_name: cell?.cell_name || perf.cell_name,
              cell_type: cell?.cell_type || 'unknown',
              lng: cell?.lng || 0,
              lat: cell?.lat || 0,
              // 前端计算指标
              pressure_ratio: calculatePressureRatio(perf.rrc_users, perf.baseline_rrc_users),
              pressure_mom: calculateMoMChange(perf.rrc_users, perf.baseline_rrc_users),
            };
          });
        },

        /**
         * 获取带计算指标的 KQI 数据
         * @returns {Array<KQIComputedV2>}
         */
        getComputedKQI: () => {
          const { kqiRealtime } = get();
          return kqiRealtime.map(kqi => ({
            ...kqi,
            // 前端计算环比
            mom_change: calculateMoMChange(kqi.metric_val, kqi.baseline_val),
            // 是否正向趋势
            is_positive_trend: kqi.metric_id === 'kqi_latency' 
              ? kqi.metric_val < kqi.baseline_val  // 时延越小越好
              : kqi.metric_val >= kqi.baseline_val, // 其他越大越好
          }));
        },

        /**
         * 获取带计算指标的 Hub 压力数据
         * @returns {Array<HubPressureComputedV2>}
         */
        getComputedHubPressure: () => {
          const { hubPressureRealtime } = get();
          return hubPressureRealtime.map(hub => ({
            ...hub,
            pressure_ratio: calculatePressureRatio(hub.rrc_users, hub.baseline_rrc_users),
            pressure_mom: calculateMoMChange(hub.rrc_users, hub.baseline_rrc_users),
            status: hub.rrc_users / hub.baseline_rrc_users > 2.5 ? 'high' 
                  : hub.rrc_users / hub.baseline_rrc_users > 2.0 ? 'medium' 
                  : 'normal',
          }));
        },

        /**
         * 获取带计算指标的 Zone 数据
         * @returns {Array<ZoneComputedV2>}
         */
        getComputedZoneData: () => {
          const { zoneUserAgg } = get();
          return zoneUserAgg.map(zone => {
            const topDevices = zone.top_devices_json 
              ? JSON.parse(zone.top_devices_json) 
              : [];
            const penetration = calculate5GAPenetration(zone.terminal_5ga, zone.total_users);
            return {
              ...zone,
              top_devices: topDevices,
              fivega_penetration: penetration,
              fivega_count: zone.terminal_5ga,
            };
          });
        },

        // ============================================
        // Actions - 兼容保留 (原有 P0-P3 数据获取)
        // ============================================

        setCurrentView: (view) => set({ currentView: view }),
        setCurrentTime: (time) => set({ currentTime: time }),
        setTimelinePlaying: (playing) => set({ isTimelinePlaying: playing }),
        setSelectedMetric: (metric) => set({ selectedMetric: metric }),

        fetchP0Data: async () => {
          set(state => ({ loading: { ...state.loading, p0: true } }));
          try {
            const [migration, tourismIndex, transport, tourismAnalysis] = await Promise.all([
              fetchP0MigrationData(),
              fetchP0TourismIndex(),
              fetchP0TransportData(),
              fetchP0TourismAnalysis(),
            ]);
            set(state => ({
              p0Data: { migration, tourismIndex, transport, tourismAnalysis },
              loading: { ...state.loading, p0: false },
            }));
          } catch (error) {
            set(state => ({
              errors: { ...state.errors, p0: error.message },
              loading: { ...state.loading, p0: false },
            }));
          }
        },

        fetchP1Data: async () => {
          set(state => ({ loading: { ...state.loading, p1: true } }));
          try {
            // 同时获取原有数据和 V2 数据
            const [global, kqi, opLogs] = [null, null, await fetchP1OpLogs()];
            
            set(state => ({
              p1Data: { global, kqi: get().getComputedKQI(), flow: null, opLogs },
              loading: { ...state.loading, p1: false },
            }));
          } catch (error) {
            set(state => ({
              errors: { ...state.errors, p1: error.message },
              loading: { ...state.loading, p1: false },
            }));
          }
        },

        fetchP2Data: async () => {
          set(state => ({ loading: { ...state.loading, p2: true } }));
          try {
            const venue = await fetchP2VenueData();
            set(state => ({
              p2Data: { venue },
              loading: { ...state.loading, p2: false },
            }));
          } catch (error) {
            set(state => ({
              errors: { ...state.errors, p2: error.message },
              loading: { ...state.loading, p2: false },
            }));
          }
        },

        fetchP3Data: async () => {
          set(state => ({ loading: { ...state.loading, p3: true } }));
          try {
            const evaluation = await fetchP3EvaluationData();
            set(state => ({
              p3Data: { evaluation },
              loading: { ...state.loading, p3: false },
            }));
          } catch (error) {
            set(state => ({
              errors: { ...state.errors, p3: error.message },
              loading: { ...state.loading, p3: false },
            }));
          }
        },

        fetchTimelineData: async () => {
          try {
            const data = await fetchTimelineData();
            set({ timelineData: data });
          } catch (error) {
            console.error('Failed to fetch timeline data:', error);
          }
        },

        // ============================================
        // Actions - 告警联动 V2
        // ============================================

        /**
         * 处理 WebSocket 告警通知
         * 通过 cell_id 查询字典获取经纬度，触发地图动画
         * @param {AlertEventV2} alert - 告警事件
         */
        handleWebSocketAlert: (alert) => {
          const coordinates = get().getCellCoordinates(alert.cell_id);
          if (coordinates) {
            // 触发地图告警动画
            const { triggerMapAlert } = get();
            if (triggerMapAlert) {
              triggerMapAlert(coordinates.lng, coordinates.lat, alert.alert_level);
            }
          }
          // 更新告警列表
          set(state => ({
            alertEventStream: [alert, ...state.alertEventStream].slice(0, 100),
          }));
        },

        /**
         * 设置地图告警触发器 (由地图组件注册)
         * @param {Function} fn - (lng, lat, level) => void
         */
        setTriggerMapAlert: (fn) => set({ triggerMapAlert: fn }),
      }),
      {
        name: 'dashboard-store-v2',
        partialize: (state) => ({
          currentView: state.currentView,
          currentTime: state.currentTime,
          selectedMetric: state.selectedMetric,
          selectedDate: state.selectedDate,
        }),
      }
    ),
    { name: 'DashboardStore' }
  )
);

export default useDashboardStore;
