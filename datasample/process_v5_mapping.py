#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
苏超智能化指挥中心 - 数据血缘表 V5 字典映射版生成脚本
根据规则添加 4 列：数据源系统、时间颗粒度、数据对接方式、真实网管映射字段
"""

import pandas as pd
import re
from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment

# 配置
INPUT_FILE = '数据血缘表-v4-最终版.xlsx'
OUTPUT_FILE = '苏超智能化指挥中心_数据血缘表_V5_字典映射版.xlsx'

# 新增列名
NEW_COLUMNS = [
    '数据源系统 (Source System)',
    '时间颗粒度 (Time Granularity)', 
    '数据对接方式 (Integration Method)',
    '真实网管映射字段 (Mapped NMS Field)'
]

# ==================== 规则 A：系统与颗粒度映射 ====================
def get_system_mapping(sheet_name):
    """根据表名获取系统映射"""
    
    # 01_Master_Cell_Dim
    if '01_Master_Cell_Dim' in sheet_name:
        return {
            '数据源系统 (Source System)': '人工维护/网优团队',
            '时间颗粒度 (Time Granularity)': '周级',
            '数据对接方式 (Integration Method)': 'Excel/CSV导入'
        }
    
    # 02_Master_User_Dim 或 04_P0_User_Active_Hourly
    if '02_Master_User_Dim' in sheet_name or '04_P0_User_Active_Hourly' in sheet_name:
        if '02' in sheet_name:
            granularity = '天级'
        else:
            granularity = '小时级'
        return {
            '数据源系统 (Source System)': 'SEQ系统(共享层)',
            '时间颗粒度 (Time Granularity)': granularity,
            '数据对接方式 (Integration Method)': 'API接口/FTP'
        }
    
    # 03_Master_Cell_Perf_Realtime (基站性能)
    if '03_Master_Cell_Perf_Realtime' in sheet_name:
        return {
            '数据源系统 (Source System)': '无线网络管平台 (MAE)',
            '时间颗粒度 (Time Granularity)': '15分钟',
            '数据对接方式 (Integration Method)': '北向接口/CSV'
        }
    
    # 05_P1_Venue_KQI_Fact 或 08_P2_App_Exp_Realtime (业务体验 KQI)
    if '05_P1_Venue_KQI_Fact' in sheet_name or '08_P2_App_Exp_Realtime' in sheet_name:
        return {
            '数据源系统 (Source System)': '无线智能板 (DSP)',
            '时间颗粒度 (Time Granularity)': '15分钟/实时',
            '数据对接方式 (Integration Method)': 'API接口'
        }
    
    # 06_P1_OAM_Event_Stream (告警事件)
    if '06_P1_OAM_Event_Stream' in sheet_name:
        return {
            '数据源系统 (Source System)': '故障告警中心 (AUTIN)',
            '时间颗粒度 (Time Granularity)': '实时/秒级',
            '数据对接方式 (Integration Method)': 'WebSocket推送'
        }
    
    # 07_P2_Zone_User_Agg_Fact - 特殊处理，返回 None 让规则 B 处理
    if '07_P2_Zone_User_Agg_Fact' in sheet_name:
        return None
    
    # 09, 10, 11 表 (复盘总结)
    if any(x in sheet_name for x in ['09_P3_Match_Summary_Fact', '10_P3_AI_Opt_Log_Fact', '11_P3_VIP_Care_Fact']):
        return {
            '数据源系统 (Source System)': '人工维护/复盘团队',
            '时间颗粒度 (Time Granularity)': '赛后单次',
            '数据对接方式 (Integration Method)': 'JSON配置'
        }
    
    # 前端视图表 P0, P1, P2, P3
    if sheet_name.startswith('P'):
        return {
            '数据源系统 (Source System)': '前端聚合计算',
            '时间颗粒度 (Time Granularity)': '实时',
            '数据对接方式 (Integration Method)': '内部API'
        }
    
    # 默认/总目录
    return {
        '数据源系统 (Source System)': '-',
        '时间颗粒度 (Time Granularity)': '-',
        '数据对接方式 (Integration Method)': '-'
    }

# ==================== 规则 B：07 表精细化切割 ====================
def get_07_row_mapping(row_data):
    """
    根据 07 表每一行的内容判断映射
    row_data: 字典，包含该行的所有列数据
    """
    # 获取可能包含指标名称的字段
    field_key = str(row_data.get('字段名(Key)', '')).lower()
    field_cn = str(row_data.get('字段名(中文)', '')).lower()
    remark = str(row_data.get('备注说明', '')).lower()
    
    # 组合所有文本用于匹配
    combined_text = f"{field_key} {field_cn} {remark}"
    
    # 包含 终端/设备 -> SEQ系统
    if any(kw in combined_text for kw in ['终端', '设备', 'device', 'model']):
        return {
            '数据源系统 (Source System)': 'SEQ系统(共享层)',
            '时间颗粒度 (Time Granularity)': '小时级',
            '数据对接方式 (Integration Method)': 'API'
        }
    
    # 包含 容量/放号 -> 人工维护
    if any(kw in combined_text for kw in ['容量', '放号', 'capacity']):
        return {
            '数据源系统 (Source System)': '人工维护',
            '时间颗粒度 (Time Granularity)': '小时级',
            '数据对接方式 (Integration Method)': '人工表单接口'
        }
    
    # 包含 5G-A渗透/比例 -> MAE
    if any(kw in combined_text for kw in ['5g-a', '5ga', '渗透', '比例', 'penetration']):
        return {
            '数据源系统 (Source System)': '无线网络管平台 (MAE)',
            '时间颗粒度 (Time Granularity)': '15分钟',
            '数据对接方式 (Integration Method)': '北向接口'
        }
    
    # 默认 -> MAE
    return {
        '数据源系统 (Source System)': '无线网络管平台 (MAE)',
        '时间颗粒度 (Time Granularity)': '15分钟',
        '数据对接方式 (Integration Method)': '北向接口'
    }

# ==================== 规则 C：网管映射字段匹配 ====================
def get_mapped_nms_field(row_data):
    """
    根据字段内容匹配网管映射字段
    """
    field_key = str(row_data.get('字段名(Key)', '')).lower()
    field_cn = str(row_data.get('字段名(中文)', '')).lower()
    remark = str(row_data.get('备注说明', '')).lower()
    
    combined_text = f"{field_key} {field_cn} {remark}"
    
    # RRC 或 连接用户
    if any(kw in combined_text for kw in ['rrc', '连接用户', 'rrc_users']):
        return 'rrc_conn_users'
    
    # 上行PRB
    if any(kw in combined_text for kw in ['上行prb', 'ul prb', 'pusch']):
        return 'prb_util_ul'
    
    # 下行PRB
    if any(kw in combined_text for kw in ['下行prb', 'dl prb', 'pdsch']):
        return 'prb_util_dl'
    
    # 上行流量
    if any(kw in combined_text for kw in ['上行', 'ul']) and any(kw in combined_text for kw in ['流量', 'traffic']):
        return 'traffic_total_ul_mb'
    
    # 下行流量
    if any(kw in combined_text for kw in ['下行', 'dl']) and any(kw in combined_text for kw in ['流量', 'traffic']):
        return 'traffic_total_dl_mb'
    
    # 总流量（无方向）
    if '流量' in combined_text and not any(kw in combined_text for kw in ['上行', '下行', 'ul', 'dl']):
        return 'traffic_total_dl_mb'  # 默认下行
    
    # 5G-A 比率
    if any(kw in combined_text for kw in ['5g-a', '5ga']) and any(kw in combined_text for kw in ['比', '率', 'ratio']):
        return 'ue_5ga_ratio'
    
    # 微信相关
    if '微信' in combined_text or 'wechat' in combined_text:
        if any(kw in combined_text for kw in ['成功', 'success']):
            return 'wx_msg_success_rate'
        if any(kw in combined_text for kw in ['上传', 'ul']):
            return 'wx_pic_ul_rate_mbps'
        return 'wx_msg_success_rate'
    
    # 抖音相关
    if '抖音' in combined_text or 'douyin' in combined_text:
        if any(kw in combined_text for kw in ['首帧', 'first frame']):
            return 'dy_video_first_frame_delay_ms'
        if any(kw in combined_text for kw in ['卡顿', 'freeze', 'stall']):
            return 'dy_video_freeze_rate'
        if any(kw in combined_text for kw in ['速率', 'rate']):
            return 'traffic_total_dl_mb'  # 抖音速率用流量代替
        return 'dy_video_first_frame_delay_ms'
    
    # 直播
    if '直播' in combined_text or 'live' in combined_text:
        if any(kw in combined_text for kw in ['速率', 'rate']):
            return 'live_hd_ul_peak_rate_mbps'
        return 'live_hd_ul_peak_rate_mbps'
    
    # 扫码/支付
    if any(kw in combined_text for kw in ['扫码', '支付', 'scan', 'pay']):
        return 'pay_scan_delay_ms'
    
    # 游戏时延
    if any(kw in combined_text for kw in ['游戏', 'game']) and any(kw in combined_text for kw in ['时延', '延迟', 'delay']):
        return 'game_avg_delay_ms'
    
    # 告警级别
    if any(kw in combined_text for kw in ['告警级别', 'alarm level', 'level']):
        return 'alarm_level'
    
    # 告警标题
    if any(kw in combined_text for kw in ['告警标题', 'alarm title', 'title']):
        return 'alarm_title'
    
    # 根因/诊断
    if any(kw in combined_text for kw in ['根因', '诊断', 'root cause', 'diagnosis']):
        return 'ai_root_cause_diagnosis'
    
    # 时延通用
    if any(kw in combined_text for kw in ['时延', '延迟', 'latency', 'delay']):
        return 'game_avg_delay_ms'
    
    # 终端型号
    if any(kw in combined_text for kw in ['终端型号', 'device', 'model', 'terminal']):
        return 'ue_tac_model'
    
    # 用户数
    if any(kw in combined_text for kw in ['用户数', 'user count', 'users']):
        return 'rrc_conn_users'
    
    # VIP
    if 'vip' in combined_text:
        return 'vip_user_count'
    
    # 容量
    if any(kw in combined_text for kw in ['容量', 'capacity']):
        return 'cell_capacity_config'
    
    # 默认返回空
    return ''

# ==================== 主处理函数 ====================
def process_sheet(sheet_name, df):
    """处理单个 Sheet"""
    
    print(f"\n处理 Sheet: {sheet_name}")
    print(f"  原始形状: {df.shape}")
    
    if df.empty:
        print(f"  跳过空表")
        return df
    
    # 复制 DataFrame
    new_df = df.copy()
    
    # 为每一行计算映射
    system_col = []
    granularity_col = []
    integration_col = []
    nms_field_col = []
    
    for idx, row in new_df.iterrows():
        row_dict = row.to_dict()
        
        # 规则 B：07 表特殊处理
        if '07_P2_Zone_User_Agg_Fact' in sheet_name:
            mapping = get_07_row_mapping(row_dict)
        else:
            # 规则 A：其他表按表名映射
            mapping = get_system_mapping(sheet_name)
        
        # 获取基础三列
        if mapping:
            system_col.append(mapping.get('数据源系统 (Source System)', '-'))
            granularity_col.append(mapping.get('时间颗粒度 (Time Granularity)', '-'))
            integration_col.append(mapping.get('数据对接方式 (Integration Method)', '-'))
        else:
            system_col.append('-')
            granularity_col.append('-')
            integration_col.append('-')
        
        # 规则 C：网管映射字段
        nms_field = get_mapped_nms_field(row_dict)
        nms_field_col.append(nms_field)
    
    # 添加新列
    new_df['数据源系统 (Source System)'] = system_col
    new_df['时间颗粒度 (Time Granularity)'] = granularity_col
    new_df['数据对接方式 (Integration Method)'] = integration_col
    new_df['真实网管映射字段 (Mapped NMS Field)'] = nms_field_col
    
    print(f"  处理后形状: {new_df.shape}")
    print(f"  新增列数: 4")
    
    return new_df

# ==================== 主程序 ====================
def main():
    print("=" * 60)
    print("苏超智能化指挥中心 - 数据血缘表 V5 字典映射版生成")
    print("=" * 60)
    
    # 读取 Excel
    print(f"\n读取输入文件: {INPUT_FILE}")
    xl = pd.ExcelFile(INPUT_FILE)
    
    # 创建 ExcelWriter
    with pd.ExcelWriter(OUTPUT_FILE, engine='openpyxl') as writer:
        
        for sheet_name in xl.sheet_names:
            # 读取原始数据
            df = xl.parse(sheet_name)
            
            # 处理
            processed_df = process_sheet(sheet_name, df)
            
            # 写入
            processed_df.to_excel(writer, sheet_name=sheet_name, index=False)
    
    print("\n" + "=" * 60)
    print(f"处理完成！输出文件: {OUTPUT_FILE}")
    print("=" * 60)

if __name__ == '__main__':
    main()
