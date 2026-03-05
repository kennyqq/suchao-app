/**
 * P1 全局态势视图 - BFF路由层 (Output模式)
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../output/p1_data.json');

function readOutputFile() {
  try {
    if (!fs.existsSync(OUTPUT_FILE)) return null;
    const rawData = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('[P1 Router] 读取失败:', error.message);
    return null;
  }
}

router.get('/data', (req, res) => {
  const outputData = readOutputFile();
  if (!outputData) {
    return res.status(500).json({ code: 500, message: '数据文件不存在' });
  }
  res.json({ ...outputData, timestamp: Date.now() });
});

router.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: 'P1服务正常',
    version: '2.0.0 (Output模式)',
    timestamp: Date.now()
  });
});

module.exports = router;
