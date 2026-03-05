/**
 * P1 全局态势视图 - BFF聚合服务
 * 
 * 职责：聚合底层数据为 P1 视图所需的结构
 */

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../data');

/**
 * 获取 P1 全局态势数据
 * 实际实现中应从各物理表聚合数据
 */
function getP1Data() {
  return {
    code: 200,
    message: 'success',
    timestamp: Date.now(),
    data: {
      globalStatus: {
        totalUsers: 48500,
        peakUsers: 52300,
        avgPrbUtil: 68.5,
        totalTrafficTb: 5.68
      }
    }
  };
}

module.exports = {
  getP1Data
};
