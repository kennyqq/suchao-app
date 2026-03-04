/**
 * P2 场内微观视图 - BFF路由层
 * 
 * 路由: /api/v1/p2/*
 * 
 * 职责：
 * 1. 接收前端HTTP请求
 * 2. 调用Service层进行数据聚合
 * 3. 返回JSON响应
 */

const express = require('express');
const router = express.Router();
const p2Service = require('../services/p2Service');

/**
 * GET /api/v1/p2/indoor-micro
 * 
 * P2场内微观视图主数据接口
 * 聚合底层MAE/SEQ/DSP/人工配置等多个数据源
 * 
 * Query参数:
 * - zone: 防线区名称 (可选，默认'南看台F区')
 * 
 * 返回结构:
 * {
 *   code: 200,
 *   message: 'success',
 *   timestamp: 1709542800000,
 *   zoneName: '南看台F区',
 *   data: {
 *     userTiers: [...],      // 金字塔漏斗数据
 *     capacity: {...},       // 放号饱和度
 *     terminals: {...},      // 终端排行
 *     experienceRadar: {...},// 体验雷达
 *     basicKqi: {...}        // 基础业务KQI
 *   }
 * }
 */
router.get('/indoor-micro', (req, res) => {
  try {
    // 获取查询参数
    const zoneName = req.query.zone || '南看台F区';
    
    console.log(`[P2 Router] GET /indoor-micro, zone=${zoneName}`);
    
    // 调用Service层聚合数据
    const result = p2Service.getIndoorMicroData(zoneName);
    
    // 返回JSON
    res.status(result.code === 200 ? 200 : (result.code || 500)).json(result);
    
  } catch (error) {
    console.error('[P2 Router] 错误:', error);
    res.status(500).json({
      code: 500,
      message: 'BFF路由层处理错误',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/p2/zones
 * 
 * 获取所有可用的防线区列表
 */
router.get('/zones', (req, res) => {
  try {
    const result = p2Service.getAvailableZones();
    res.json(result);
  } catch (error) {
    console.error('[P2 Router] 获取区域列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取区域列表失败'
    });
  }
});

/**
 * GET /api/v1/p2/health
 * 
 * P2服务健康检查
 */
router.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: 'P2场内微观BFF服务正常',
    service: 'p2-indoor-micro',
    version: '1.0.0',
    timestamp: Date.now()
  });
});

module.exports = router;
