#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
无线网管数据字典汇总文档生成脚本
读取所有提取的 JSON 文件，生成完整的 Markdown 文档
"""

import json
import os
from pathlib import Path

# 输入文件路径
INPUT_DIR = Path("datasample/backend/datasample/backend/extracted")
OUTPUT_FILE = Path("datasample/backend/无线网管数据字典汇总.md")

# 数据血缘表字段映射
DATA_LINEAGE_MAPPING = {
    "rrc_users": {
        "description": "RRC连接用户数",
        "indicators": [
            {"code": "GNBOA01", "name": "RRC.ConnMax", "file": "5G 1分钟粒度", "granularity": "1分钟"},
            {"code": "GNBHK06", "name": "RRC.ConnMax", "file": "5G 15分钟粒度", "granularity": "15分钟"},
            {"code": "GNBHK05", "name": "RRC.ConnMean", "file": "5G 15分钟粒度", "granularity": "15分钟"},
        ]
    },
    "prb_used": {
        "description": "PRB已用资源",
        "indicators": [
            {"code": "GNBOF01", "name": "RRU.PrbAssnUl", "file": "5G 1分钟粒度", "granularity": "1分钟"},
            {"code": "GNBOF02", "name": "RRU.PrbAssnDl", "file": "5G 1分钟粒度", "granularity": "1分钟"},
            {"code": "GNBHA04", "name": "RRU.DtchPrbAssnUl", "file": "5G 15分钟粒度", "granularity": "15分钟"},
            {"code": "GNBHA05", "name": "RRU.DtchPrbAssnDl", "file": "5G 15分钟粒度", "granularity": "15分钟"},
        ]
    },
    "prb_total": {
        "description": "PRB总资源",
        "indicators": [
            {"code": "GNBOF03", "name": "RRU.PrbTotUl", "file": "5G 1分钟粒度", "granularity": "1分钟"},
            {"code": "GNBOF04", "name": "RRU.PrbTotDl", "file": "5G 1分钟粒度", "granularity": "1分钟"},
            {"code": "GNBHA09", "name": "RRU.PuschPrbTot", "file": "5G 15分钟粒度", "granularity": "15分钟"},
            {"code": "GNBHA10", "name": "RRU.PdschPrbTot", "file": "5G 15分钟粒度", "granularity": "15分钟"},
        ]
    },
    "traffic_mb": {
        "description": "流量(MB)",
        "indicators": [
            {"code": "GNBOE01", "name": "RLC.UpOctUl", "file": "5G 1分钟粒度", "granularity": "1分钟"},
            {"code": "GNBOE02", "name": "RLC.UpOctDl", "file": "5G 1分钟粒度", "granularity": "1分钟"},
            {"code": "GNBOJ01", "name": "MAC.CpOctUl", "file": "5G 1分钟粒度", "granularity": "1分钟"},
            {"code": "GNBOJ02", "name": "MAC.CpOctDl", "file": "5G 1分钟粒度", "granularity": "1分钟"},
            {"code": "GNBHC13", "name": "MAC.CpOctUl", "file": "5G 15分钟粒度", "granularity": "15分钟"},
            {"code": "GNBHC14", "name": "MAC.CpOctDl", "file": "5G 15分钟粒度", "granularity": "15分钟"},
        ]
    },
    "latency_ms": {
        "description": "时延(ms)",
        "indicators": [
            {"code": "GNBOE03", "name": "RLC.ThrpTimeUL", "file": "5G 1分钟粒度", "granularity": "1分钟"},
            {"code": "GNBOE04", "name": "RLC.ThrpTimeDL", "file": "5G 1分钟粒度", "granularity": "1分钟"},
        ]
    },
    "douyin_rate": {
        "description": "抖音速率(Kbps)",
        "indicators": [
            {"code": "GNBAIUE05", "name": "SVid.TotVidDownloadDv", "file": "5G KQI指标", "granularity": "15分钟"},
            {"code": "GNBAIUE06", "name": "SVid.TotVidDownloadTime", "file": "5G KQI指标", "granularity": "15分钟"},
            {"code": "GNBAICELL03", "name": "SVid.TotVidDownloadDv", "file": "5G KQI指标", "granularity": "15分钟"},
            {"code": "GNBAICELL04", "name": "SVid.TotVidDownloadTime", "file": "5G KQI指标", "granularity": "15分钟"},
        ]
    },
    "game_latency": {
        "description": "游戏时延(ms)",
        "indicators": [
            {"code": "GNBAIUE07", "name": "SVid.TotDlVidTcpRtt", "file": "5G KQI指标", "granularity": "15分钟"},
            {"code": "GNBAIUE08", "name": "SVid.TotDlVidPktsForTcpRtt", "file": "5G KQI指标", "granularity": "15分钟"},
            {"code": "GNBAICELL02", "name": "SVid.TotDlVidTcpRtt", "file": "5G KQI指标", "granularity": "15分钟"},
        ]
    },
    "poor_qoe_users": {
        "description": "质差用户数",
        "indicators": [
            {"code": "GNBAIUE03", "name": "SVid.TotVidPauseDur", "file": "5G KQI指标", "granularity": "15分钟"},
            {"code": "GNBAIUE04", "name": "SVid.TotVidStallsTimes", "file": "5G KQI指标", "granularity": "15分钟"},
            {"code": "GNBAICELL07", "name": "SVid.TotVidPauseDur", "file": "5G KQI指标", "granularity": "15分钟"},
            {"code": "GNBAICELL08", "name": "SVid.TotVidStallsTimes", "file": "5G KQI指标", "granularity": "15分钟"},
        ]
    },
}


def load_json_file(filepath):
    """加载 JSON 文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return None


def count_indicators(data):
    """统计指标数量"""
    count = 0
    if 'indicators' in data:
        for group, indicators in data['indicators'].items():
            if isinstance(indicators, list):
                count += len(indicators)
    return count


def clean_text(text):
    """清理文本中的特殊字符"""
    if text is None:
        return ""
    text = str(text)
    # 替换换行符和多余空格
    text = text.replace('\r', '').replace('\n', ' ').strip()
    # 处理表格中的 | 字符
    text = text.replace('|', '\\|')
    return text


def generate_indicator_table(indicators):
    """生成指标明细表格"""
    if not indicators:
        return "*暂无指标数据*\n"
    
    lines = []
    lines.append("| 指标编码 | 英文名称 | 中文名称 | 定义 | 单位 |")
    lines.append("|---------|---------|---------|------|------|")
    
    for ind in indicators:
        code = clean_text(ind.get('code', ''))
        name_en = clean_text(ind.get('name_en', ''))
        name_cn = clean_text(ind.get('name_cn', ''))
        definition = clean_text(ind.get('definition', ''))
        unit = clean_text(ind.get('unit', ''))
        
        # 限制定义长度
        if len(definition) > 100:
            definition = definition[:97] + "..."
        
        lines.append(f"| {code} | {name_en} | {name_cn} | {definition} | {unit} |")
    
    return '\n'.join(lines) + '\n'


def generate_group_table(index_list):
    """生成分组索引表格"""
    if not index_list:
        return ""
    
    lines = []
    lines.append("| 分组代码 | 分组名称 |")
    lines.append("|---------|---------|")
    
    for item in index_list:
        code = clean_text(item.get('code', ''))
        name = clean_text(item.get('name', ''))
        # 过滤掉说明性质的条目
        if code and name and name != 'nan' and not code.startswith('注'):
            lines.append(f"| {code} | {name} |")
    
    return '\n'.join(lines) + '\n'


def generate_section(title, file_data, file_key):
    """生成文档章节"""
    lines = []
    lines.append(f"## {title}\n")
    
    # 文件信息
    lines.append("### 文件信息\n")
    lines.append(f"- 文件名：{clean_text(file_data.get('file_name', ''))}")
    lines.append(f"- 说明：{clean_text(file_data.get('description', ''))}")
    lines.append(f"- Sheet数量：{file_data.get('sheet_count', 0)} 个")
    lines.append(f"- 指标数量：{count_indicators(file_data)} 个\n")
    
    # 指标分组
    if 'index' in file_data and file_data['index']:
        lines.append("### 指标分组\n")
        lines.append(generate_group_table(file_data['index']))
        lines.append("\n")
    
    # 关键指标明细
    if 'indicators' in file_data and file_data['indicators']:
        lines.append("### 关键指标明细\n")
        
        for group_code, indicators in file_data['indicators'].items():
            # 跳过空分组和非指标分组
            if not indicators or not isinstance(indicators, list):
                continue
            
            # 查找分组名称
            group_name = group_code
            if 'index' in file_data:
                for item in file_data['index']:
                    if item.get('code') == group_code:
                        group_name = f"{group_code} - {item.get('name', group_code)}"
                        break
            
            lines.append(f"#### {group_name}\n")
            lines.append(generate_indicator_table(indicators))
            lines.append("\n")
    
    return '\n'.join(lines)


def generate_mapping_table():
    """生成关键指标映射对照表"""
    lines = []
    lines.append("## 6. 关键指标映射对照表\n")
    lines.append("本表汇总数据血缘表字段与网管指标之间的映射关系，用于数据追溯和指标计算。\n")
    lines.append("| 数据血缘表字段 | 字段含义 | 网管指标编码 | 网管指标名称 | 粒度 | 所属文件 |")
    lines.append("|--------------|---------|-------------|-------------|------|---------|")
    
    for field, info in DATA_LINEAGE_MAPPING.items():
        description = info['description']
        indicators = info['indicators']
        
        for i, ind in enumerate(indicators):
            field_display = field if i == 0 else ""
            desc_display = description if i == 0 else ""
            lines.append(f"| {field_display} | {desc_display} | {ind['code']} | {ind['name']} | {ind['granularity']} | {ind['file']} |")
    
    lines.append("\n")
    return '\n'.join(lines)


def generate_data_source_section():
    """生成数据来源说明章节"""
    lines = []
    lines.append("## 7. 数据来源说明\n")
    lines.append("### 7.1 数据文件清单\n")
    lines.append("| 序号 | 文件名 | 网元类型 | 粒度 | 主要指标类别 |")
    lines.append("|-----|--------|---------|------|-------------|")
    lines.append("| 1 | gnb_1min.json | 5G基站 | 1分钟 | RRC连接、PRB资源、流量、切换 |")
    lines.append("| 2 | gnb_15min.json | 5G基站 | 15分钟 | PHY层、MAC层、RLC层、PDCP层 |")
    lines.append("| 3 | kqi.json | 5G智能板 | 15分钟 | 业务质量KQI指标 |")
    lines.append("| 4 | enb_1min.json | 4G基站 | 1分钟 | RRC连接、E-RAB、无线资源 |")
    lines.append("| 5 | enb_15min.json | 4G基站 | 15分钟 | 全量KPI指标 |")
    lines.append("\n")
    
    lines.append("### 7.2 指标编码规则\n")
    lines.append("- **5G指标编码格式**：`GNB` + `分组代码` + `序号`\n")
    lines.append("  - 例如：`GNBOA01` 表示 5G OA分组（RRC连接相关统计）的第1个指标\n")
    lines.append("  - 分组代码：OA-OJ（1分钟粒度）、HA-HX（15分钟粒度）\n")
    lines.append("- **KQI指标编码格式**：`GNBAI` + `UE/CELL` + `序号`\n")
    lines.append("  - 例如：`GNBAIUE01` 表示 5G KQI UE级指标第1个\n")
    lines.append("  - 例如：`GNBAICELL01` 表示 5G KQI 小区级指标第1个\n")
    lines.append("- **4G指标编码格式**：`ENB` + `分组代码` + `序号`\n")
    lines.append("  - 例如：`ENBHA01` 表示 4G HA分组的第1个指标\n")
    lines.append("\n")
    
    lines.append("### 7.3 数据来源系统\n")
    lines.append("- **数据来源**：江苏移动无线网管系统（OMC）\n")
    lines.append("- **采集方式**：北向接口性能测量数据\n")
    lines.append("- **数据格式**：JSON 结构化数据\n")
    lines.append("- **更新周期**：实时采集，按粒度聚合\n")
    lines.append("\n")
    
    return '\n'.join(lines)


def main():
    """主函数"""
    # 加载所有 JSON 文件
    files = {
        "5G 1分钟粒度 KPI": INPUT_DIR / "gnb_1min.json",
        "5G 15分钟粒度 KPI": INPUT_DIR / "gnb_15min.json",
        "5G 智能板 KQI 指标": INPUT_DIR / "kqi.json",
        "4G 1分钟粒度 KPI": INPUT_DIR / "enb_1min.json",
        "4G 15分钟粒度 KPI": INPUT_DIR / "enb_15min.json",
    }
    
    loaded_data = {}
    total_indicators = 0
    
    for title, filepath in files.items():
        if filepath.exists():
            data = load_json_file(filepath)
            if data:
                loaded_data[title] = data
                count = count_indicators(data)
                total_indicators += count
                print(f"[OK] 加载 {title}: {count} 个指标")
        else:
            print(f"[ERR] 文件不存在: {filepath}")
    
    # 生成 Markdown 文档
    lines = []
    
    # 文档标题
    lines.append("# 无线网管数据字典汇总\n")
    
    # 概述
    lines.append("## 概述\n")
    lines.append("- **数据来源**：江苏移动无线网管系统（OMC）\n")
    lines.append("- **文件总数**：5 个\n")
    lines.append(f"- **指标总数**：约 {total_indicators}+ 个\n")
    lines.append("- **涵盖范围**：4G/5G 基站 KPI 指标、智能板 KQI 业务质量指标\n")
    lines.append("- **时间粒度**：1分钟、15分钟\n")
    lines.append("\n")
    
    # 各章节
    section_num = 1
    for title, data in loaded_data.items():
        lines.append(f"## {section_num}. {title.split(' ', 1)[1] if ' ' in title else title}\n")
        
        # 文件信息
        lines.append(f"### {section_num}.1 文件信息\n")
        lines.append(f"- 文件名：{clean_text(data.get('file_name', ''))}")
        lines.append(f"- 说明：{clean_text(data.get('description', ''))}")
        lines.append(f"- Sheet数量：{data.get('sheet_count', 0)} 个")
        lines.append(f"- 指标数量：{count_indicators(data)} 个\n")
        
        # 指标分组
        if 'index' in data and data['index']:
            lines.append(f"### {section_num}.2 指标分组\n")
            lines.append(generate_group_table(data['index']))
            lines.append("\n")
        
        # 关键指标明细（独立于指标分组，因为KQI文件可能没有index但有indicators）
        if 'indicators' in data and data['indicators']:
            lines.append(f"### {section_num}.3 关键指标明细\n")
            
            sub_section = 1
            for group_code, indicators in data['indicators'].items():
                if not indicators or not isinstance(indicators, list):
                    continue
                
                # 查找分组名称
                group_name = group_code
                if 'index' in data:
                    for item in data['index']:
                        if item.get('code') == group_code:
                            group_name = f"{group_code} - {item.get('name', group_code)}"
                            break
                
                # 对于KQI文件，如果没有在index中找到，直接使用group_code
                if group_name == group_code and group_code in ['UE级业务质量指标', '小区级业务质量指标']:
                    group_name = group_code
                
                lines.append(f"#### {section_num}.3.{sub_section} {group_name}\n")
                lines.append(generate_indicator_table(indicators))
                lines.append("\n")
                sub_section += 1
        
        section_num += 1
        lines.append("\n---\n\n")
    
    # 关键指标映射对照表
    lines.append(generate_mapping_table())
    
    # 数据来源说明
    lines.append(generate_data_source_section())
    
    # 附录：指标统计汇总
    lines.append("## 附录：指标统计汇总\n")
    lines.append("| 文件 | 指标数量 | 主要分组 |\n")
    lines.append("|-----|---------|---------|\n")
    for title, data in loaded_data.items():
        count = count_indicators(data)
        groups = []
        if 'indicators' in data:
            for g in data['indicators'].keys():
                if not g.startswith('注') and g != '数据上报的统一要求':
                    groups.append(g)
        groups_str = ', '.join(groups[:5]) + ('...' if len(groups) > 5 else '')
        lines.append(f"| {title} | {count} | {groups_str} |\n")
    lines.append("\n")
    
    # 写入文件
    output_content = ''.join(lines)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(output_content)
    
    print(f"\n[OK] Markdown 文档已生成: {OUTPUT_FILE}")
    print(f"  总指标数: {total_indicators}")
    print(f"  文件大小: {len(output_content)} 字符")


if __name__ == "__main__":
    main()
