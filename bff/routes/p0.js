/**
 * P0 宏观溯源视图 - BFF路由层
 * 
 * 路由: /api/v1/p0/*
 * 
 * 核心功能：
 * 1. GET /timeline-index - 返回时间轴索引
 * 2. GET /data - 根据日期和时间返回对应切片数据
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Output 目录配置
const P0_OUTPUT_DIR = path.join(__dirname, '../output/p0');

/**
 * 安全地读取 JSON 文件
 */
function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const rawData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error(`[P0 Router] 读取失败: ${filePath}`, error.message);
    return null;
  }
}

/**
 * GET /api/v1/p0/timeline-index
 * 
 * 返回时间轴索引，包含所有可用日期和时间刻度
 */
router.get('/timeline-index', (req, res) => {
  try {
    console.log('[P0 Router] GET /timeline-index');
    
    const indexPath = path.join(P0_OUTPUT_DIR, 'timeline_index.json');
    const indexData = readJsonSafe(indexPath);
    
    if (!indexData) {
      return res.status(500).json({
        code: 500,
        message: '时间轴索引文件不存在',
        hint: '请先运行造数脚本: node bff/scripts/generateP0Data.js'
      });
    }
    
    res.json({
      code: 200,
      message: 'success',
      serverTime: Date.now(),
      data: indexData
    });
    
  } catch (error) {
    console.error('[P0 Router] 错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取时间轴索引失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/p0/data
 * 
 * 根据日期和时间参数返回对应的时间切片数据
 * 
 * Query参数:
 * - date: 日期，格式 YYYYMMDD (如 20260304)
 * - time: 时间，格式 HHmm (如 0900) 或 HH:mm (如 09:00)
 */
router.get('/data', (req, res) => {
  try {
    const { date, time } = req.query;
    
    console.log(`[P0 Router] GET /data, date=${date}, time=${time}`);
    
    // 参数校验
    if (!date || !time) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        required: ['date (YYYYMMDD)', 'time (HHmm 或 HH:mm)'],
        example: '/api/v1/p0/data?date=20260304&time=0900'
      });
    }
    
    // 标准化时间格式 (09:00 -> 0900)
    const normalizedTime = time.replace(':', '');
    
    // 验证格式
    if (!/^\d{8}$/.test(date)) {
      return res.status(400).json({
        code: 400,
        message: '日期格式错误',
        expected: 'YYYYMMDD (如 20260304)',
        received: date
      });
    }
    
    if (!/^\d{4}$/.test(normalizedTime)) {
      return res.status(400).json({
        code: 400,
        message: '时间格式错误',
        expected: 'HHmm 或 HH:mm (如 0900 或 09:00)',
        received: time
      });
    }
    
    // 构建文件路径
    const slicePath = path.join(P0_OUTPUT_DIR, date, `${normalizedTime}.json`);
    console.log(`[P0 Router] 读取切片: ${slicePath}`);
    
    // 读取切片数据
    const sliceData = readJsonSafe(slicePath);
    
    if (!sliceData) {
      return res.status(404).json({
        code: 404,
        message: '时间切片数据不存在',
        date: date,
        time: normalizedTime,
        hint: '该时间点可能尚未生成数据，或参数错误'
      });
    }
    
    res.json({
      code: 200,
      message: 'success',
      query: {
        date: date,
        time: normalizedTime,
        formatted: `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)} ${normalizedTime.slice(0,2)}:${normalizedTime.slice(2,4)}`
      },
      data: sliceData
    });
    
  } catch (error) {
    console.error('[P0 Router] 错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取数据失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/p0/health
 * 
 * P0服务健康检查
 */
router.get('/health', (req, res) => {
  const outputExists = fs.existsSync(P0_OUTPUT_DIR);
  const indexExists = fs.existsSync(path.join(P0_OUTPUT_DIR, 'timeline_index.json'));
  
  res.json({
    code: 200,
    message: 'P0宏观溯源服务正常',
    service: 'p0-macro-tracing',
    version: '2.0.0 (时序回放模式)',
    output: {
      exists: outputExists,
      indexExists: indexExists,
      path: P0_OUTPUT_DIR
    },
    timestamp: Date.now()
  });
});

module.exports = router;
