/**
 * 大屏健壮性测试造数脚本 (Mock Generator)
 * 
 * 功能：生成过去1周的历史压测数据，用于测试大屏在长周期海量数据下的健壮性
 * 
 * 数据规模：
 * - Static: 1份全局配置
 * - Hourly: 168条/实体 (7天 × 24小时)
 * - 15Min: 672条/实体 (7天 × 96个15分钟)
 * 
 * 执行：node bff/scripts/generateMockData.js
 */

const fs = require('fs');
const path = require('path');

// 配置
const DATA_DIR = path.join(__dirname, '../data');
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7天毫秒数
const ONE_HOUR_MS = 60 * 60 * 1000;          // 1小时毫秒数
const ONE_15MIN_MS = 15 * 60 * 1000;         // 15分钟毫秒数

// 当前时间基准
const NOW = Date.now();
const START_TIME = NOW - ONE_WEEK_MS;

// 区域配置
const ZONES = ['南看台F区', '北看台B区', '东看台A区', '西看台VIP'];
const CELL_IDS = [
  '460-00-1122-01',
  '460-00-1122-02',
  '460-00-1122-03',
  '460-00-1122-04'
];

// 设备型号池
const DEVICE_POOL = [
  { model: '华为Mate60 Pro', capability: '5G-A' },
  { model: '华为Mate60', capability: '5G-A' },
  { model: 'iPhone 15 Pro Max', capability: '5G-A' },
  { model: 'iPhone 15 Pro', capability: '5G-A' },
  { model: '小米14', capability: '5G-A' },
  { model: '小米14 Pro', capability: '5G-A' },
  { model: '华为P60', capability: '5G' },
  { model: '华为P60 Pro', capability: '5G' },
  { model: 'iPhone 14', capability: '5G' },
  { model: 'iPhone 14 Pro', capability: '5G' },
  { model: '三星S24 Ultra', capability: '5G-A' },
  { model: '荣耀Magic6', capability: '5G-A' },
  { model: 'vivo X100', capability: '5G' },
  { model: 'OPPO Find X7', capability: '5G-A' }
];

/**
 * 生成随机整数 [min, max]
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成随机浮点数 [min, max]，保留指定小数位
 */
function randomFloat(min, max, decimals = 1) {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
}

/**
 * 获取当前小时数 (0-23)，用于模拟潮汐效应
 */
function getHourOfDay(timestamp) {
  return new Date(timestamp).getHours();
}

/**
 * 计算潮汐系数 (白天高、夜间低)
 * @param {number} timestamp - 时间戳
 * @returns {number} 0.3-1.0 的系数
 */
function getTideFactor(timestamp) {
  const hour = getHourOfDay(timestamp);
  // 白天 8-22点: 较高，夜间 23-7点: 较低
  if (hour >= 8 && hour <= 22) {
    // 白天高峰期 (12-20点): 1.0，其他: 0.8-0.9
    return hour >= 12 && hour <= 20 ? randomFloat(0.95, 1.0, 2) : randomFloat(0.8, 0.95, 2);
  } else {
    // 夜间低谷期: 0.3-0.5
    return randomFloat(0.3, 0.5, 2);
  }
}

/**
 * 生成 Static 类数据
 */
function generateStaticData() {
  console.log('\n📁 生成 Static 数据...');

  // 1. MANUAL_CELL_CONFIG.json
  const cellConfig = {
    tableName: 'MANUAL_CELL_CONFIG',
    description: '人工维护-小区基础配置表(静态)',
    lastUpdate: new Date(NOW).toISOString(),
    records: ZONES.map((zone, index) => ({
      cell_id: CELL_IDS[index],
      zone_name: zone,
      cell_name: `${zone}-1`,
      longitude: randomFloat(118.79, 118.80, 6),
      latitude: randomFloat(32.05, 32.07, 6),
      band: index === 3 ? 'n79' : 'n78', // VIP区用n79
      bandwidth_mhz: 100,
      cell_type: index === 3 ? '微站' : '宏站'
    }))
  };

  // 2. MANUAL_CAPACITY_CONFIG.json
  const capacityConfig = {
    tableName: 'MANUAL_CAPACITY_CONFIG',
    description: '人工维护-区域容量配置表(静态)',
    lastUpdate: new Date(NOW).toISOString(),
    records: ZONES.map((zone, index) => ({
      zone_name: zone,
      cell_capacity_config: index === 3 ? 35000 : randomInt(55000, 65000) // VIP区容量较小
    }))
  };

  // 3. MANUAL_POST_MATCH_SUMMARY.json
  const postMatchSummary = {
    tableName: 'MANUAL_POST_MATCH_SUMMARY',
    description: '人工维护-赛后总结评估表(静态)',
    lastUpdate: new Date(NOW).toISOString(),
    records: [
      {
        match_id: `MATCH_${new Date(NOW).toISOString().split('T')[0].replace(/-/g, '')}_001`,
        match_name: '江苏vs山东',
        match_date: new Date(NOW).toISOString().split('T')[0],
        total_attendance: randomInt(45000, 52000),
        peak_users: randomInt(50000, 55000),
        avg_prb_util: randomFloat(65, 75, 1),
        satisfaction_score: randomInt(88, 95),
        key_issues: [' halftime时段容量紧张', '东门出口弱覆盖'],
        optimization_suggestions: ['建议扩容东门区域', '优化 halftime 负载均衡策略']
      }
    ]
  };

  // 4. SEQ_USER_PROFILE_DAILY.json
  const userProfileDaily = {
    tableName: 'SEQ_USER_PROFILE_DAILY',
    description: 'SEQ系统(共享层)-用户画像日统计(静态)',
    lastUpdate: new Date(NOW).toISOString(),
    records: ZONES.map((zone, index) => ({
      date: new Date(NOW).toISOString().split('T')[0],
      zone_name: zone,
      total_subscribers: index === 3 ? randomInt(30000, 35000) : randomInt(45000, 52000),
      vip_subscribers: index === 3 ? randomInt(18000, 20000) : randomInt(2500, 3500),
      gold_card_ratio: randomFloat(15, 20, 1),
      silver_card_ratio: randomFloat(20, 25, 1),
      normal_ratio: randomFloat(55, 65, 1),
      avg_age: randomInt(30, 40),
      top_app: ['微信', '抖音', '王者荣耀', '支付宝']
    }))
  };

  // 写入文件
  fs.writeFileSync(
    path.join(DATA_DIR, 'static/MANUAL_CELL_CONFIG.json'),
    JSON.stringify(cellConfig, null, 2)
  );
  fs.writeFileSync(
    path.join(DATA_DIR, 'static/MANUAL_CAPACITY_CONFIG.json'),
    JSON.stringify(capacityConfig, null, 2)
  );
  fs.writeFileSync(
    path.join(DATA_DIR, 'static/MANUAL_POST_MATCH_SUMMARY.json'),
    JSON.stringify(postMatchSummary, null, 2)
  );
  fs.writeFileSync(
    path.join(DATA_DIR, 'static/SEQ_USER_PROFILE_DAILY.json'),
    JSON.stringify(userProfileDaily, null, 2)
  );

  console.log('  ✓ MANUAL_CELL_CONFIG.json (4条小区配置)');
  console.log('  ✓ MANUAL_CAPACITY_CONFIG.json (4条容量配置)');
  console.log('  ✓ MANUAL_POST_MATCH_SUMMARY.json (1条赛后总结)');
  console.log('  ✓ SEQ_USER_PROFILE_DAILY.json (4条用户画像)');
}

/**
 * 生成 Hourly 类数据
 */
function generateHourlyData() {
  console.log('\n📁 生成 Hourly 数据 (168小时周期)...');

  const hourlyRecordsCount = Math.floor(ONE_WEEK_MS / ONE_HOUR_MS); // 168条

  // 1. SEQ_DEVICE_HOURLY.json
  const deviceHourlyRecords = [];
  for (let i = 0; i < hourlyRecordsCount; i++) {
    const timestamp = START_TIME + i * ONE_HOUR_MS;
    
    // 为每个区域生成记录
    ZONES.forEach((zone, zoneIndex) => {
      const tideFactor = getTideFactor(timestamp);
      
      // 生成TOP5设备排行（带潮汐波动）
      const topDevices = [];
      const shuffled = [...DEVICE_POOL].sort(() => 0.5 - Math.random());
      for (let j = 0; j < 5; j++) {
        const baseCount = zoneIndex === 3 ? 3000 : 5000; // VIP区基数小
        topDevices.push({
          model: shuffled[j].model,
          count: Math.floor(baseCount * tideFactor * randomFloat(0.8, 1.2, 2)),
          capability: shuffled[j].capability
        });
      }
      
      deviceHourlyRecords.push({
        timestamp,
        hour: getHourOfDay(timestamp),
        zone_name: zone,
        top_devices_json: topDevices
      });
    });
  }

  const deviceHourly = {
    tableName: 'SEQ_DEVICE_HOURLY',
    description: 'SEQ系统(共享层)-终端统计(小时粒度)',
    lastUpdate: new Date(NOW).toISOString(),
    records: deviceHourlyRecords
  };

  // 2. SEQ_USER_HOURLY.json
  const userHourlyRecords = [];
  for (let i = 0; i < hourlyRecordsCount; i++) {
    const timestamp = START_TIME + i * ONE_HOUR_MS;
    
    ZONES.forEach((zone, zoneIndex) => {
      const tideFactor = getTideFactor(timestamp);
      const baseUsers = zoneIndex === 3 ? 30000 : 45000;
      
      userHourlyRecords.push({
        timestamp,
        hour: getHourOfDay(timestamp),
        zone_name: zone,
        active_users: Math.floor(baseUsers * tideFactor * randomFloat(0.9, 1.1, 2)),
        new_users: Math.floor(randomInt(500, 1500) * tideFactor),
        roaming_users: Math.floor(randomInt(3000, 10000) * tideFactor),
        avg_session_duration_min: randomInt(40, 60),
        total_data_gb: randomFloat(800, 1500, 1) * tideFactor
      });
    });
  }

  const userHourly = {
    tableName: 'SEQ_USER_HOURLY',
    description: 'SEQ系统(共享层)-用户行为小时统计(小时粒度)',
    lastUpdate: new Date(NOW).toISOString(),
    records: userHourlyRecords
  };

  // 写入文件
  fs.writeFileSync(
    path.join(DATA_DIR, 'hourly/SEQ_DEVICE_HOURLY.json'),
    JSON.stringify(deviceHourly, null, 2)
  );
  fs.writeFileSync(
    path.join(DATA_DIR, 'hourly/SEQ_USER_HOURLY.json'),
    JSON.stringify(userHourly, null, 2)
  );

  console.log(`  ✓ SEQ_DEVICE_HOURLY.json (${deviceHourlyRecords.length}条)`);
  console.log(`  ✓ SEQ_USER_HOURLY.json (${userHourlyRecords.length}条)`);
}

/**
 * 生成 15Min 类数据
 */
function generate15MinData() {
  console.log('\n📁 生成 15Min 数据 (672周期)...');

  const min15RecordsCount = Math.floor(ONE_WEEK_MS / ONE_15MIN_MS); // 672条

  // 1. MAE_PERF_15MIN.json
  const maePerfRecords = [];
  for (let i = 0; i < min15RecordsCount; i++) {
    const timestamp = START_TIME + i * ONE_15MIN_MS;
    
    CELL_IDS.forEach((cellId, index) => {
      const tideFactor = getTideFactor(timestamp);
      const baseUsers = index === 3 ? 35000 : 45000; // VIP区人数多但容量小
      const rrcUsers = Math.floor(baseUsers * tideFactor * randomFloat(0.9, 1.05, 2));
      
      maePerfRecords.push({
        timestamp,
        cell_id: cellId,
        zone_name: ZONES[index],
        rrc_conn_users: rrcUsers,
        vip_rrc_users: Math.floor(rrcUsers * (index === 3 ? 0.55 : 0.07)), // VIP区VIP占比高
        prb_util_ul: randomFloat(55, 75, 1),
        prb_util_dl: randomFloat(60, 80, 1),
        traffic_total_ul_mb: randomFloat(1000, 2500, 1) * tideFactor,
        traffic_total_dl_mb: randomFloat(4000, 7000, 1) * tideFactor
      });
    });
  }

  const maePerf = {
    tableName: 'MAE_PERF_15MIN',
    description: '无线网络管平台-基站性能指标(15分钟粒度)',
    lastUpdate: new Date(NOW).toISOString(),
    records: maePerfRecords
  };

  // 2. DSP_KQI_15MIN.json
  const dspKqiRecords = [];
  for (let i = 0; i < min15RecordsCount; i++) {
    const timestamp = START_TIME + i * ONE_15MIN_MS;
    
    CELL_IDS.forEach((cellId, index) => {
      const tideFactor = getTideFactor(timestamp);
      // 高峰期KQI可能略有下降
      const kqiFactor = tideFactor > 0.8 ? randomFloat(0.95, 1.0, 2) : 1.0;
      
      dspKqiRecords.push({
        timestamp,
        cell_id: cellId,
        zone_name: ZONES[index],
        ue_5ga_ratio: index === 3 ? randomFloat(55, 65, 1) : randomFloat(30, 40, 1),
        dy_video_first_frame_delay_ms: Math.floor(randomInt(150, 250) / kqiFactor),
        dy_video_freeze_rate: randomFloat(1.5, 3.5, 1) / kqiFactor,
        wx_msg_success_rate: randomFloat(98.5, 99.8, 1) * kqiFactor,
        wx_pic_ul_rate_mbps: randomFloat(10, 20, 1),
        game_avg_delay_ms: Math.floor(randomInt(30, 50) / kqiFactor),
        pay_scan_delay_ms: Math.floor(randomInt(350, 550) / kqiFactor),
        live_hd_ul_peak_rate_mbps: randomFloat(20, 35, 1) * tideFactor
      });
    });
  }

  const dspKqi = {
    tableName: 'DSP_KQI_15MIN',
    description: '无线智能板-KQI业务质量指标(15分钟粒度)',
    lastUpdate: new Date(NOW).toISOString(),
    records: dspKqiRecords
  };

  // 3. AUTIN_ALARM_REALTIME.json
  const alarmRecords = [];
  const alarmTypes = ['干扰', '弱覆盖', '容量', '掉线', '切换失败'];
  const severities = ['low', 'medium', 'high', 'critical'];
  
  // 生成少量告警（约占总记录数的1%）
  const alarmCount = Math.floor(min15RecordsCount * 0.1);
  for (let i = 0; i < alarmCount; i++) {
    const randomTime = START_TIME + randomInt(0, min15RecordsCount - 1) * ONE_15MIN_MS;
    const zoneIndex = randomInt(0, 3);
    const severity = severities[randomInt(0, severities.length - 1)];
    
    alarmRecords.push({
      timestamp: randomTime,
      alarm_id: `ALM_${String(i + 1).padStart(3, '0')}`,
      zone_name: ZONES[zoneIndex],
      cell_id: CELL_IDS[zoneIndex],
      alarm_type: alarmTypes[randomInt(0, alarmTypes.length - 1)],
      severity,
      title: `${ZONES[zoneIndex]}-${severity === 'high' || severity === 'critical' ? '严重告警' : '一般告警'}`,
      description: '自动生成的测试告警数据',
      status: Math.random() > 0.3 ? 'cleared' : 'active', // 70%已清除
      duration_min: randomInt(5, 60)
    });
  }
  
  // 按时间排序
  alarmRecords.sort((a, b) => a.timestamp - b.timestamp);

  const alarmData = {
    tableName: 'AUTIN_ALARM_REALTIME',
    description: 'AUTIN告警系统-实时告警数据(15分钟粒度)',
    lastUpdate: new Date(NOW).toISOString(),
    records: alarmRecords
  };

  // 写入文件
  fs.writeFileSync(
    path.join(DATA_DIR, '15min/MAE_PERF_15MIN.json'),
    JSON.stringify(maePerf, null, 2)
  );
  fs.writeFileSync(
    path.join(DATA_DIR, '15min/DSP_KQI_15MIN.json'),
    JSON.stringify(dspKqi, null, 2)
  );
  fs.writeFileSync(
    path.join(DATA_DIR, '15min/AUTIN_ALARM_REALTIME.json'),
    JSON.stringify(alarmData, null, 2)
  );

  console.log(`  ✓ MAE_PERF_15MIN.json (${maePerfRecords.length}条)`);
  console.log(`  ✓ DSP_KQI_15MIN.json (${dspKqiRecords.length}条)`);
  console.log(`  ✓ AUTIN_ALARM_REALTIME.json (${alarmRecords.length}条)`);
}

/**
 * 主函数
 */
function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     大屏健壮性测试造数脚本 (Mock Generator)               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\n📅 时间范围: ${new Date(START_TIME).toLocaleString()} ~ ${new Date(NOW).toLocaleString()}`);
  console.log(`📊 数据规模: 7天历史数据`);

  try {
    // 生成各类数据
    generateStaticData();
    generateHourlyData();
    generate15MinData();

    // 汇总输出
    console.log('\n' + '='.repeat(60));
    console.log('✅ 造数完成！数据汇总：');
    console.log('='.repeat(60));
    console.log('📁 Static  (静态配置):  4个文件');
    console.log('📁 Hourly  (小时级):    2个文件 × ~672条 = ~1,344条');
    console.log('📁 15Min   (15分钟级):  3个文件 × ~2,688条 = ~8,064条');
    console.log('────────────────────────────────────────────────────────────');
    console.log('💾 数据已写入 bff/data/{static,hourly,15min}/');
    console.log('\n⚠️  请重启 BFF 服务 (npm run dev) 以加载新数据！');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ 造数失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 执行
main();
