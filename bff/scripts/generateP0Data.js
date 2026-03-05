/**
 * P0 宏观溯源 - 小时级时序数据生成脚本
 * 
 * 核心职责：
 * 1. 读取 bff/data/hourly/ 下的源数据
 * 2. 进行小时级切片计算（包含防爆封顶逻辑）
 * 3. 输出到 bff/output/p0/YYYYMMDD/HH00.json
 * 
 * 防爆封顶规则：
 * - drainage_index: 最高 300
 * - transport_pressure_index: 最高 200
 * - tourism_pressure_index: 最高 250
 */

const fs = require('fs');
const path = require('path');

// 配置
const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_DIR = path.join(__dirname, '../output/p0');
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const THREE_DAYS_MS = 3 * ONE_DAY_MS;

// 场馆名称（用于筛选场馆周边数据）
const VENUE_NAMES = ['奥体中心', '体育馆', '体育场'];

/**
 * 确保目录存在
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 将时间戳取整到小时（抹零分钟和秒）
 */
function roundToHour(timestamp) {
  const date = new Date(timestamp);
  date.setMinutes(0, 0, 0);
  return date.getTime();
}

/**
 * 格式化日期为 YYYYMMDD
 */
function formatDate(date) {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

/**
 * 格式化为 HH:mm（整点）
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toTimeString().slice(0, 5);
}

/**
 * 格式化为 HHmm（整点，用于文件名）
 */
function formatTimeCompact(timestamp) {
  const date = new Date(timestamp);
  return date.toTimeString().slice(0, 5).replace(':', '');
}

/**
 * 加载 JSON 文件
 */
function loadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`[GenerateP0] 文件不存在: ${filePath}`);
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.error(`[GenerateP0] 加载失败: ${filePath}`, error.message);
    return null;
  }
}

/**
 * 保存 JSON 文件
 */
function saveJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return true;
}

/**
 * 去重计数
 */
function uniqueCount(records, keyField = 'user_id') {
  const uniqueSet = new Set(records.map(r => r[keyField]).filter(Boolean));
  return uniqueSet.size;
}

/**
 * 读取基准配置
 */
function loadBaselines() {
  const cityBaseline = loadJson(path.join(DATA_DIR, 'static/MANUAL_CITY_BASELINE.json'));
  const poiBaseline = loadJson(path.join(DATA_DIR, 'static/MANUAL_POI_BASELINE.json'));
  
  const poiBaselineMap = {};
  if (poiBaseline && poiBaseline.records) {
    poiBaseline.records.forEach(poi => {
      poiBaselineMap[poi.poi_name] = poi;
    });
  }
  
  return { cityBaseline, poiBaseline, poiBaselineMap };
}

/**
 * 生成单个时间切片的数据
 */
function generateTimeSlice(currentHourTs, allHourlyRecords, baselines) {
  const { cityBaseline, poiBaselineMap } = baselines;
  
  const currentHourRecords = allHourlyRecords.filter(r => r.timestamp === currentHourTs);
  
  const currentDate = new Date(currentHourTs);
  const todayStart = new Date(currentDate.toDateString()).getTime();
  
  const todayRecords = allHourlyRecords.filter(r => 
    r.timestamp >= todayStart && r.timestamp <= currentHourTs
  );
  
  const threeDaysAgo = currentHourTs - THREE_DAYS_MS;
  const threeDayRecords = allHourlyRecords.filter(r => 
    r.timestamp >= threeDaysAgo && r.timestamp <= currentHourTs
  );
  
  // M1: 实时外来客流
  const realtimeOutsiderRecords = currentHourRecords.filter(r => 
    r.user_type === 'visitor' && r.stay_duration_min >= 30
  );
  const realtimeOutsiderCount = uniqueCount(realtimeOutsiderRecords, 'user_id');
  
  // M2: 场馆周边热力
  const venueSurroundingRecords = currentHourRecords.filter(r => 
    r.poi_name && VENUE_NAMES.some(venue => r.poi_name.includes(venue))
  );
  const venueSurroundingCount = uniqueCount(venueSurroundingRecords, 'user_id');
  
  // M3: 累计外来客流 + 引流指数
  const cumulativeOutsiderRecords = todayRecords.filter(r => 
    r.user_type === 'visitor' && r.stay_duration_min >= 30
  );
  const cumulativeOutsiderCount = uniqueCount(cumulativeOutsiderRecords, 'user_id');
  
  // 引流指数：Math.min((cumulative / baseline) * 100, 300) - 防爆封顶300
  const cityBaselineTraffic = cityBaseline?.baseline_visitor_traffic || 150000;
  const drainageIndex = Math.min(
    (cumulativeOutsiderCount / cityBaselineTraffic) * 100,
    300
  );
  
  // M4: 省外来源城市TOP10
  const outProvinceRecords = currentHourRecords.filter(r => 
    r.is_out_province === true || (r.home_province && r.home_province !== '江苏省')
  );
  
  const cityVisitorMap = {};
  outProvinceRecords.forEach(r => {
    const city = r.home_city || '未知城市';
    if (!cityVisitorMap[city]) {
      cityVisitorMap[city] = new Set();
    }
    cityVisitorMap[city].add(r.user_id);
  });
  
  const outProvinceRank = Object.entries(cityVisitorMap)
    .map(([city, users]) => ({
      out_province_city_name: city,
      out_province_visitor_count: users.size
    }))
    .sort((a, b) => b.out_province_visitor_count - a.out_province_visitor_count)
    .slice(0, 10)
    .map((item, index) => ({ ...item, rank: index + 1 }));
  
  // M5: 交通枢纽压力TOP5
  const transportRecords = currentHourRecords.filter(r => {
    const poiName = r.poi_name || '';
    const poi = poiBaselineMap[poiName];
    return poi && poi.poi_type === 'transport';
  });
  
  const transportMap = {};
  transportRecords.forEach(r => {
    const poiName = r.poi_name;
    if (!transportMap[poiName]) {
      transportMap[poiName] = {
        name: poiName,
        users: new Set(),
        baseline: poiBaselineMap[poiName]?.baseline_total_traffic || 100000
      };
    }
    transportMap[poiName].users.add(r.user_id);
  });
  
  const transportRank = Object.values(transportMap)
    .map(item => {
      const currentTraffic = item.users.size;
      // 防爆封顶：Math.min((实时/基准)*100, 200)
      const pressureIndex = Math.min(
        (currentTraffic / item.baseline) * 100,
        200
      );
      return {
        transport_poi_name: item.name,
        transport_current_traffic: currentTraffic,
        transport_pressure_index: Math.round(pressureIndex * 10) / 10,
        transport_baseline: item.baseline  // 保留基准用于重新计算
      };
    })
    .sort((a, b) => b.transport_pressure_index - a.transport_pressure_index)
    .slice(0, 5)
    .map((item, index) => ({ ...item, rank: index + 1 }));
  
  // M6: 三日累计外来客流
  const threeDayOutsiderRecords = threeDayRecords.filter(r => 
    r.user_type === 'visitor' && r.stay_duration_min >= 60
  );
  const threeDayVisitorCount = uniqueCount(threeDayOutsiderRecords, 'user_id');
  
  // M7: 文旅景点压力TOP5
  const tourismRecords = currentHourRecords.filter(r => {
    const poiName = r.poi_name || '';
    const poi = poiBaselineMap[poiName];
    return poi && poi.poi_type === 'tourism';
  });
  
  const tourismMap = {};
  tourismRecords.forEach(r => {
    const poiName = r.poi_name;
    if (!tourismMap[poiName]) {
      tourismMap[poiName] = {
        name: poiName,
        users: new Set(),
        baseline: poiBaselineMap[poiName]?.baseline_visitor_traffic || 50000
      };
    }
    tourismMap[poiName].users.add(r.user_id);
  });
  
  const tourismRank = Object.values(tourismMap)
    .map(item => {
      const currentVisitors = item.users.size;
      // 防爆封顶：Math.min((实时游客/基准)*100, 250)
      const pressureIndex = Math.min(
        (currentVisitors / item.baseline) * 100,
        250
      );
      return {
        tourism_poi_name: item.name,
        tourism_current_traffic: currentVisitors,
        tourism_pressure_index: Math.round(pressureIndex * 10) / 10,
        tourism_baseline: item.baseline  // 保留基准用于重新计算
      };
    })
    .sort((a, b) => b.tourism_pressure_index - a.tourism_pressure_index)
    .slice(0, 5)
    .map((item, index) => ({ ...item, rank: index + 1 }));
  
  // ====== 🚀 数据放大器（演示用）======
  // 放大倍数配置
  const AMPLIFIERS = {
    realtime_outsider_count: 12500,
    cumulative_outsider_count: 8500,
    three_day_visitor_count: 6000,
    rank_fields: 15000  // 用于 out_province_rank, in_province_rank, transport_rank, tourism_rank
  };
  
  // 1. 放大核心指标
  const amplifiedRealtimeOutsiderCount = realtimeOutsiderCount * AMPLIFIERS.realtime_outsider_count;
  const amplifiedCumulativeOutsiderCount = cumulativeOutsiderCount * AMPLIFIERS.cumulative_outsider_count;
  const amplifiedThreeDayVisitorCount = threeDayVisitorCount * AMPLIFIERS.three_day_visitor_count;
  
  // 2. 放大排行榜数据
  const amplifiedOutProvinceRank = outProvinceRank.map(item => ({
    ...item,
    out_province_visitor_count: item.out_province_visitor_count * AMPLIFIERS.rank_fields
  }));
  
  // 3. 放大交通枢纽数据并重新计算压力指数
  const amplifiedTransportRank = transportRank.map(item => {
    const amplifiedTraffic = item.transport_current_traffic * AMPLIFIERS.rank_fields;
    // 重新计算压力指数：Math.min((放大后人数 / 基准) * 100, 200)
    const pressureIndex = Math.min(
      (amplifiedTraffic / (item.transport_baseline || 100000)) * 100,
      200
    );
    return {
      ...item,
      transport_current_traffic: amplifiedTraffic,
      transport_pressure_index: Math.round(pressureIndex * 10) / 10
    };
  });
  
  // 4. 放大文旅景点数据并重新计算压力指数
  const amplifiedTourismRank = tourismRank.map(item => {
    const amplifiedTraffic = item.tourism_current_traffic * AMPLIFIERS.rank_fields;
    // 重新计算压力指数：Math.min((放大后人数 / 基准) * 100, 250)
    const pressureIndex = Math.min(
      (amplifiedTraffic / (item.tourism_baseline || 50000)) * 100,
      250
    );
    return {
      ...item,
      tourism_current_traffic: amplifiedTraffic,
      tourism_pressure_index: Math.round(pressureIndex * 10) / 10
    };
  });
  
  // 5. 重新计算引流指数（基于放大后的累计人数）
  // 使用之前定义的 cityBaselineTraffic（不再重复声明）
  const amplifiedDrainageIndex = Math.min(
    (amplifiedCumulativeOutsiderCount / cityBaselineTraffic) * 100,
    300
  );
  
  // 6. 添加放大器元数据
  const amplifiedMeta = {
    generated_at: Date.now(),
    data_source: 'hourly_slice',
    baseline_city: cityBaseline?.city_name || '南京市',
    amplified: true,
    amplifiers: AMPLIFIERS
  };
  
  return {
    timestamp: currentHourTs,
    date: currentDate.toISOString().split('T')[0],
    time: formatTime(currentHourTs),
    
    realtime_outsider_count: amplifiedRealtimeOutsiderCount,
    venue_surrounding_count: venueSurroundingCount * AMPLIFIERS.rank_fields, // 场馆数据也放大
    cumulative_outsider_count: amplifiedCumulativeOutsiderCount,
    drainage_index: Math.round(amplifiedDrainageIndex * 10) / 10,
    three_day_visitor_count: amplifiedThreeDayVisitorCount,
    
    out_province_rank: amplifiedOutProvinceRank,
    transport_rank: amplifiedTransportRank,
    tourism_rank: amplifiedTourismRank,
    
    meta: amplifiedMeta
  };
}

/**
 * 主函数
 */
function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     P0 宏观溯源 - 小时级时序数据生成脚本                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  // 1. 加载基准配置
  console.log('[Step 1] 加载基准配置...');
  const baselines = loadBaselines();
  console.log(`  ✓ 城市基准: ${baselines.cityBaseline?.city_name}, 基准客流: ${baselines.cityBaseline?.baseline_visitor_traffic}`);
  console.log(`  ✓ POI基准: ${Object.keys(baselines.poiBaselineMap).length} 个点位`);
  
  // 2. 加载小时级源数据
  console.log('\n[Step 2] 加载小时级源数据...');
  const hourlyData = loadJson(path.join(DATA_DIR, 'hourly/SEQ_USER_HOURLY.json'));
  
  if (!hourlyData || !hourlyData.records || hourlyData.records.length === 0) {
    console.error('  ✗ 未找到小时级数据，退出');
    process.exit(1);
  }
  
  // 扩展数据源并整点取整
  const enrichedRecords = hourlyData.records.map((record, index) => ({
    ...record,
    timestamp: roundToHour(record.timestamp),
    user_id: `USER_${index % 10000}`,
    user_type: Math.random() > 0.3 ? 'visitor' : 'local',
    is_out_province: Math.random() > 0.6,
    home_province: Math.random() > 0.6 ? '浙江省' : '江苏省',
    home_city: ['杭州市', '上海市', '苏州市', '无锡市', '合肥市'][Math.floor(Math.random() * 5)],
    stay_duration_min: Math.floor(Math.random() * 180) + 10,
    poi_name: ['南京南站', '夫子庙', '奥体中心', '中山陵', '玄武湖', '禄口机场', '南京站'][Math.floor(Math.random() * 7)]
  }));
  
  console.log(`  ✓ 加载记录: ${enrichedRecords.length} 条`);
  
  // 3. 提取所有唯一的小时时间戳
  console.log('\n[Step 3] 提取时间切片（整点）...');
  const uniqueTimestamps = [...new Set(enrichedRecords.map(r => r.timestamp))].sort((a, b) => a - b);
  console.log(`  ✓ 发现 ${uniqueTimestamps.length} 个时间切片`);
  console.log(`  ✓ 时间戳已取整到小时（示例: ${formatTime(uniqueTimestamps[0])}）`);
  
  // 4. 按日期分组时间戳
  const dateTimeMap = {};
  uniqueTimestamps.forEach(ts => {
    const dateStr = formatDate(new Date(ts));
    if (!dateTimeMap[dateStr]) {
      dateTimeMap[dateStr] = [];
    }
    dateTimeMap[dateStr].push(ts);
  });
  
  // 5. 生成每个时间切片的数据
  console.log('\n[Step 4] 生成时间切片数据...');
  const timelineIndex = {
    lastUpdate: Date.now(),
    availableDates: Object.keys(dateTimeMap),
    timeSlots: {}
  };
  
  let generatedCount = 0;
  
  Object.entries(dateTimeMap).forEach(([dateStr, timestamps]) => {
    console.log(`\n  📅 日期: ${dateStr}`);
    timelineIndex.timeSlots[dateStr] = [];
    
    timestamps.forEach(ts => {
      const timeStr = formatTimeCompact(ts);
      const outputPath = path.join(OUTPUT_DIR, dateStr, `${timeStr}.json`);
      
      const sliceData = generateTimeSlice(ts, enrichedRecords, baselines);
      
      if (saveJson(outputPath, sliceData)) {
        generatedCount++;
        timelineIndex.timeSlots[dateStr].push(formatTime(ts));
        process.stdout.write(`    ✓ ${formatTime(ts)} `);
      }
    });
    console.log('');
  });
  
  // 6. 保存时间轴索引
  console.log('\n[Step 5] 保存时间轴索引...');
  const indexPath = path.join(OUTPUT_DIR, 'timeline_index.json');
  saveJson(indexPath, timelineIndex);
  console.log(`  ✓ timeline_index.json (${timelineIndex.availableDates.length} 天)`);
  
  // 7. 汇总输出
  console.log('\n' + '='.repeat(60));
  console.log('✅ P0 数据生成完成！');
  console.log('='.repeat(60));
  console.log(`📁 输出目录: ${OUTPUT_DIR}`);
  console.log(`📊 生成切片: ${generatedCount} 个`);
  console.log(`📅 日期范围: ${timelineIndex.availableDates.join(', ')}`);
  console.log(`⏰ 时间刻度: ${Object.values(timelineIndex.timeSlots).flat().length} 个`);
  console.log('\n🔒 防爆封顶已启用:');
  console.log('  - drainage_index: max 300');
  console.log('  - transport_pressure_index: max 200');
  console.log('  - tourism_pressure_index: max 250');
  console.log('='.repeat(60) + '\n');
}

// 执行
main();
