/**
 * P0 宏观溯源视图 - API 请求模块
 * 
 * 对接 BFF 中台服务
 * 支持小时级时序回放
 */

// BFF 服务基础地址
const BFF_BASE_URL = import.meta.env.VITE_BFF_URL || 'http://localhost:3000/api/v1';

/**
 * 获取时间轴索引
 * 包含所有可用日期和时间刻度
 */
export async function fetchP0TimelineIndex() {
  try {
    const url = `${BFF_BASE_URL}/p0/timeline-index`;
    console.log('[P0 API] 获取时间轴索引:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.code !== 200) {
      throw new Error(result.message);
    }

    console.log('[P0 API] 时间轴索引获取成功:', 
      result.data.availableDates.length, '天,', 
      Object.values(result.data.timeSlots).flat().length, '个时间刻度'
    );
    
    return result.data;
    
  } catch (error) {
    console.error('[P0 API] 获取时间轴索引失败:', error.message);
    throw error;
  }
}

/**
 * 获取指定时间切片的数据
 * @param {string} date - 日期，格式 YYYYMMDD (如 20260304)
 * @param {string} time - 时间，格式 HHmm (如 0900) 或 HH:mm (如 09:00)
 */
export async function fetchP0Data(date, time) {
  try {
    // 标准化时间格式
    const normalizedTime = time.replace(':', '');
    const url = `${BFF_BASE_URL}/p0/data?date=${date}&time=${normalizedTime}`;
    
    console.log('[P0 API] 获取时间切片:', date, normalizedTime);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.code !== 200) {
      throw new Error(result.message);
    }

    console.log('[P0 API] 数据获取成功:', result.query.formatted);
    return result.data;
    
  } catch (error) {
    console.error('[P0 API] 获取数据失败:', error.message);
    throw error;
  }
}

/**
 * 从时间轴索引中提取默认时间点
 * 默认选中：最新一天、最晚的一个时间点
 * @param {Object} timelineIndex - 时间轴索引
 * @returns {Object} { date: '20260304', time: '18:00' }
 */
export function getDefaultTimePoint(timelineIndex) {
  if (!timelineIndex || !timelineIndex.availableDates || timelineIndex.availableDates.length === 0) {
    return null;
  }
  
  // 最新日期
  const latestDate = timelineIndex.availableDates[timelineIndex.availableDates.length - 1];
  const timeSlots = timelineIndex.timeSlots[latestDate];
  
  if (!timeSlots || timeSlots.length === 0) {
    return null;
  }
  
  // 最晚时间点
  const latestTime = timeSlots[timeSlots.length - 1];
  
  return {
    date: latestDate,
    time: latestTime,
    formatted: `${latestDate.slice(0,4)}-${latestDate.slice(4,6)}-${latestDate.slice(6,8)} ${latestTime}`
  };
}
