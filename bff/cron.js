/**
 * BFF 数据聚合定时任务 (Cron Job)
 * 
 * 职责：
 * 1. 定时读取 data/ 下分层文件夹里的 9 张物理表
 * 2. 复用 p0Service~p3Service 聚合逻辑
 * 3. 将计算后的最终 JSON 物理落盘保存到 output/ 目录
 * 
 * 执行频率：15秒（模拟生产环境的5分钟）
 * 
 * 人工干预：
 * - 客户可以直接修改 output/p2_data.json 等文件，实现数据强制覆盖
 * - API 层只读取 output/ 文件，不再实时计算
 */

const fs = require('fs');
const path = require('path');

// 导入聚合服务
const p0Service = require('./services/p0Service');
const p1Service = require('./services/p1Service');
const p2Service = require('./services/p2Service');
const p3Service = require('./services/p3Service');

// 配置
const OUTPUT_DIR = path.join(__dirname, 'output');
const CRON_INTERVAL_MS = 15000; // 15秒（模拟生产5分钟）

// 确保 output 目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log('[Cron] 创建 output 目录');
}

/**
 * 生成 P0 宏观溯源数据
 */
function generateP0Data() {
  try {
    // TODO: 实现 P0 聚合逻辑
    const data = {
      code: 200,
      message: 'success',
      timestamp: Date.now(),
      data: {
        overview: {
          totalAttendance: 48500,
          networkQuality: '优',
          activeCells: 24,
          alarmCount: 2
        },
        meta: {
          dataSource: 'cron',
          lastUpdate: new Date().toISOString()
        }
      }
    };
    return data;
  } catch (error) {
    console.error('[Cron] P0 数据生成失败:', error.message);
    return null;
  }
}

/**
 * 生成 P1 全局态势数据
 */
function generateP1Data() {
  try {
    // TODO: 实现 P1 聚合逻辑
    const data = {
      code: 200,
      message: 'success',
      timestamp: Date.now(),
      data: {
        globalStatus: {
          totalUsers: 48500,
          peakUsers: 52300,
          avgPrbUtil: 68.5,
          totalTrafficTb: 5.68
        },
        meta: {
          dataSource: 'cron',
          lastUpdate: new Date().toISOString()
        }
      }
    };
    return data;
  } catch (error) {
    console.error('[Cron] P1 数据生成失败:', error.message);
    return null;
  }
}

/**
 * 生成 P2 场内微观数据
 */
function generateP2Data() {
  try {
    // 调用现有 P2 聚合服务
    const zoneName = '南看台F区';
    const result = p2Service.getIndoorMicroData(zoneName);
    
    if (result.code !== 200) {
      throw new Error(result.message);
    }
    
    return {
      code: 200,
      message: 'success',
      timestamp: Date.now(),
      zoneName: result.zoneName,
      data: result.data
    };
  } catch (error) {
    console.error('[Cron] P2 数据生成失败:', error.message);
    return null;
  }
}

/**
 * 生成 P3 评估闭环数据
 */
function generateP3Data() {
  try {
    // TODO: 实现 P3 聚合逻辑
    const data = {
      code: 200,
      message: 'success',
      timestamp: Date.now(),
      data: {
        matchSummary: {
          matchId: 'MATCH_20240304_001',
          matchName: '江苏vs山东',
          satisfactionScore: 92,
          totalIssues: 3,
          resolvedIssues: 2
        },
        meta: {
          dataSource: 'cron',
          lastUpdate: new Date().toISOString()
        }
      }
    };
    return data;
  } catch (error) {
    console.error('[Cron] P3 数据生成失败:', error.message);
    return null;
  }
}

/**
 * 写入 JSON 文件（原子写入，避免读取时文件不完整）
 * @param {string} filename - 文件名
 * @param {object} data - 数据对象
 */
function writeJsonFile(filename, data) {
  try {
    const filePath = path.join(OUTPUT_DIR, filename);
    const tempPath = filePath + '.tmp';
    
    // 先写入临时文件
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    
    // 原子重命名（覆盖原文件）
    fs.renameSync(tempPath, filePath);
    
    console.log(`[Cron] ✓ 已生成: ${filename}`);
    return true;
  } catch (error) {
    console.error(`[Cron] ✗ 写入失败: ${filename}`, error.message);
    return false;
  }
}

/**
 * 执行一次完整的聚合任务
 */
function runAggregation() {
  const timestamp = new Date().toISOString();
  console.log(`\n[Cron] ===== 开始聚合任务 @ ${timestamp} =====`);
  
  // 生成并写入各视图数据
  const p0Data = generateP0Data();
  if (p0Data) writeJsonFile('p0_data.json', p0Data);
  
  const p1Data = generateP1Data();
  if (p1Data) writeJsonFile('p1_data.json', p1Data);
  
  const p2Data = generateP2Data();
  if (p2Data) writeJsonFile('p2_data.json', p2Data);
  
  const p3Data = generateP3Data();
  if (p3Data) writeJsonFile('p3_data.json', p3Data);
  
  console.log('[Cron] ===== 聚合任务完成 =====\n');
}

// 立即执行一次
runAggregation();

// 定时执行
const intervalId = setInterval(runAggregation, CRON_INTERVAL_MS);

console.log(`[Cron] 定时聚合服务已启动`);
console.log(`[Cron] 执行间隔: ${CRON_INTERVAL_MS / 1000}秒`);
console.log(`[Cron] 输出目录: ${OUTPUT_DIR}`);
console.log(`[Cron] 人工干预: 可直接修改 output/*.json 文件\n`);

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n[Cron] 接收到退出信号，清理资源...');
  clearInterval(intervalId);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Cron] 接收到终止信号，清理资源...');
  clearInterval(intervalId);
  process.exit(0);
});

module.exports = {
  runAggregation,
  generateP0Data,
  generateP1Data,
  generateP2Data,
  generateP3Data
};
