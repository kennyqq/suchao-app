/**
 * 苏超智能化指挥中心 - BFF中台服务
 * Backend For Frontend API Gateway
 * 
 * 职责：
 * 1. 聚合底层多个数据源（MAE网管/SEQ信令/DSP智能板/AUTIN告警/人工维护）
 * 2. 为前端P0-P3四大视图提供结构化API
 * 3. 处理数据转换、过滤、联表等中台逻辑
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// 导入路由
const p2Routes = require('./routes/p2');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 中间件配置 =====

// 跨域配置 - 允许任何前端端口访问（本地开发阶段最稳妥的配置）
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON解析
app.use(express.json());

// 请求日志
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ===== 健康检查 =====
app.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: 'BFF服务正常运行',
    data: {
      service: 'suchao-bff',
      version: '1.0.0',
      timestamp: Date.now()
    }
  });
});

// ===== API路由注册 =====

// P2 场内微观视图路由
app.use('/api/v1/p2', p2Routes);

// 其他视图路由占位（后续扩展）
app.use('/api/v1/p0', (req, res) => {
  res.json({ code: 200, message: 'P0宏观溯源API - 开发中' });
});
app.use('/api/v1/p1', (req, res) => {
  res.json({ code: 200, message: 'P1全局态势API - 开发中' });
});
app.use('/api/v1/p3', (req, res) => {
  res.json({ code: 200, message: 'P3评估闭环API - 开发中' });
});

// ===== 错误处理 =====
app.use((err, req, res, next) => {
  console.error('[BFF Error]', err);
  res.status(500).json({
    code: 500,
    message: 'BFF中台服务内部错误',
    error: err.message
  });
});

// ===== 404处理 =====
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: `路由不存在: ${req.method} ${req.url}`
  });
});

// ===== 启动服务 =====
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 苏超 BFF 中台服务已启动运行');
  console.log('='.repeat(60));
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`📋 API前缀:  /api/v1`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
  console.log(`📊 P2场内微观: http://localhost:${PORT}/api/v1/p2/indoor-micro`);
  console.log('='.repeat(60) + '\n');
});

module.exports = app;
