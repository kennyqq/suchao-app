/**
 * P0 宏观溯源视图 - BFF聚合服务
 * 
 * 职责：聚合底层数据为 P0 视图所需的结构
 */

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../data');

/**
 * 获取 P0 宏观溯源数据
 * 实际实现中应从各物理表聚合数据
 */
function getP0Data() {
  return {
    code: 200,
    message: 'success',
    timestamp: Date.now(),
    data: {
      overview: {
        totalAttendance: 48500,
        networkQuality: '优',
        activeCells: 24,
        alarmCount: 2
      }
    }
  };
}

module.exports = {
  getP0Data
};
