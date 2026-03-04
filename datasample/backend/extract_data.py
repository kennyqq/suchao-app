#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
提取无线网管数据字典中的关键信息
"""

import pandas as pd
import json
import os

backend_dir = '.'
output_dir = 'datasample/backend/extracted'
os.makedirs(output_dir, exist_ok=True)

def extract_gnb_1min():
    """提取 5G 1分钟粒度 KPI"""
    print('提取 5G 1分钟粒度 KPI...')
    xl = pd.ExcelFile(f'{backend_dir}/gNB北向接口性能测量数据规范（1分钟）v1.0.0-正式发布版-240109.xlsx')
    
    result = {
        'file_name': 'gNB北向接口性能测量数据规范（1分钟）',
        'description': '5G基站KPI指标，1分钟粒度',
        'sheet_count': len(xl.sheet_names),
        'index': [],
        'indicators': {}
    }
    
    # 读取 Index
    idx_df = xl.parse('Index')
    for _, row in idx_df.iterrows():
        result['index'].append({
            'code': str(row.iloc[0]),
            'name': str(row.iloc[1])
        })
    
    print(f'  发现 {len(result["index"])} 个指标分组')
    
    # 读取每个分组的指标
    for sheet in xl.sheet_names[2:]:
        try:
            df = xl.parse(sheet)
            if len(df) > 0:
                indicators = []
                for _, row in df.iterrows():
                    code = row.get('统计编码')
                    if pd.notna(code) or pd.notna(row.get('英文名称')):
                        indicators.append({
                            'code': str(code) if pd.notna(code) else '',
                            'name_en': str(row.get('英文名称', '')),
                            'name_cn': str(row.get('中文名称', '')),
                            'definition': str(row.get('定义', ''))[:100],
                            'unit': str(row.get('单位', ''))
                        })
                result['indicators'][sheet] = indicators[:10]  # 只取前10个
                print(f'    {sheet}: {len(indicators)} 个指标')
        except Exception as e:
            print(f'    Error {sheet}: {e}')
    
    with open(f'{output_dir}/gnb_1min.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print('  已保存')
    return result

def extract_gnb_15min():
    """提取 5G 15分钟粒度 KPI"""
    print('\n提取 5G 15分钟粒度 KPI...')
    xl = pd.ExcelFile(f'{backend_dir}/6-5G SA gNB网元统计数据需求规范-PM(V2.0.0)-正式发布版-20240701.xlsx')
    
    result = {
        'file_name': '6-5G SA gNB网元统计数据需求规范-PM(V2.0.0)',
        'description': '5G基站KPI指标，15分钟粒度',
        'sheet_count': len(xl.sheet_names),
        'index': [],
        'indicators': {}
    }
    
    # 读取 Index
    idx_df = xl.parse('Index')
    for _, row in idx_df.iterrows():
        if pd.notna(row.iloc[0]):
            result['index'].append({
                'code': str(row.iloc[0]),
                'name': str(row.iloc[1])
            })
    
    print(f'  发现 {len(result["index"])} 个指标分组')
    
    # 读取关键分组：HA(PHY), HC(MAC), HK(RRC)
    key_sheets = ['HA', 'HC', 'HK']
    for sheet in key_sheets:
        if sheet in xl.sheet_names:
            try:
                df = xl.parse(sheet)
                if len(df) > 0:
                    indicators = []
                    for _, row in df.iterrows():
                        code = row.get('统计编码')
                        if pd.notna(code):
                            indicators.append({
                                'code': str(code),
                                'name_en': str(row.get('英文名称', '')),
                                'name_cn': str(row.get('中文名称', '')),
                                'importance': str(row.get('重要度', '')),
                                'definition': str(row.get('定义', ''))[:100],
                                'unit': str(row.get('单位', ''))
                            })
                    result['indicators'][sheet] = indicators[:15]
                    print(f'    {sheet}: {len(indicators)} 个指标')
            except Exception as e:
                print(f'    Error {sheet}: {e}')
    
    with open(f'{output_dir}/gnb_15min.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print('  已保存')
    return result

def extract_kqi():
    """提取 5G 智能板 KQI 指标"""
    print('\n提取 5G 智能板 KQI 指标...')
    xl = pd.ExcelFile(f'{backend_dir}/5G无线网络OMC智能化北向接口技术要求 第二部分业务质量数据-v1.0.0-正式发布.xlsx')
    
    result = {
        'file_name': '5G无线网络OMC智能化北向接口技术要求-业务质量数据',
        'description': '无线智能板北向接口，包含KQI类指标，颗粒度15分钟',
        'sheet_count': len(xl.sheet_names),
        'indicators': {}
    }
    
    # 读取 UE级业务质量指标
    df = xl.parse(xl.sheet_names[2])
    indicators = []
    for _, row in df.iterrows():
        if pd.notna(row.get('统计编码')):
            indicators.append({
                'code': str(row.get('统计编码')),
                'name_en': str(row.get('英文名称', '')),
                'name_cn': str(row.get('中文名称', '')),
                'definition': str(row.get('定义', ''))[:80],
                'unit': str(row.get('单位', ''))
            })
    result['indicators']['UE级业务质量指标'] = indicators[:15]
    print(f'  UE级: {len(indicators)} 个指标')
    
    # 读取小区级业务质量指标
    df = xl.parse(xl.sheet_names[3])
    indicators = []
    for _, row in df.iterrows():
        if pd.notna(row.get('统计编码')):
            indicators.append({
                'code': str(row.get('统计编码')),
                'name_en': str(row.get('英文名称', '')),
                'name_cn': str(row.get('中文名称', '')),
                'definition': str(row.get('定义', ''))[:80],
                'unit': str(row.get('单位', ''))
            })
    result['indicators']['小区级业务质量指标'] = indicators[:15]
    print(f'  小区级: {len(indicators)} 个指标')
    
    with open(f'{output_dir}/kqi.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print('  已保存')
    return result

def extract_enb_1min():
    """提取 4G 1分钟粒度 KPI"""
    print('\n提取 4G 1分钟粒度 KPI...')
    xl = pd.ExcelFile(f'{backend_dir}/eNB北向接口性能测量数据规范（1分钟）v1.0.0-发布版_240109.xlsx')
    
    result = {
        'file_name': 'eNB北向接口性能测量数据规范（1分钟）',
        'description': '4G基站KPI指标，1分钟粒度',
        'sheet_count': len(xl.sheet_names),
        'index': [],
        'indicators': {}
    }
    
    # 读取 Index
    idx_df = xl.parse('Index')
    for _, row in idx_df.iterrows():
        if pd.notna(row.iloc[0]):
            result['index'].append({
                'code': str(row.iloc[0]),
                'name': str(row.iloc[1])
            })
    
    print(f'  发现 {len(result["index"])} 个指标分组')
    
    # 读取关键分组
    key_sheets = ['A', 'J', 'E']  # RRC, MAC, PHY
    for sheet in key_sheets:
        if sheet in xl.sheet_names:
            try:
                df = xl.parse(sheet)
                if len(df) > 0:
                    indicators = []
                    for _, row in df.head(10).iterrows():
                        indicators.append({
                            'name_en': str(row.get('英文名称', '')),
                            'name_cn': str(row.get('中文名称', '')),
                            'unit': str(row.get('单位', ''))
                        })
                    result['indicators'][sheet] = indicators
                    print(f'    {sheet}: {len(indicators)} 个指标')
            except Exception as e:
                print(f'    Error {sheet}: {e}')
    
    with open(f'{output_dir}/enb_1min.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print('  已保存')
    return result

def extract_enb_15min():
    """提取 4G 15分钟粒度 KPI"""
    print('\n提取 4G 15分钟粒度 KPI...')
    xl = pd.ExcelFile(f'{backend_dir}/2-eNB网元统计数据需求规范-PM(V4.4)-正式发布版-20240701.xlsx')
    
    result = {
        'file_name': '2-eNB网元统计数据需求规范-PM(V4.4)',
        'description': '4G基站KPI指标，15分钟粒度，有上千个',
        'sheet_count': len(xl.sheet_names),
        'index': [],
        'indicators': {}
    }
    
    # 读取 Index
    idx_df = xl.parse('Index')
    for _, row in idx_df.iterrows():
        if pd.notna(row.iloc[0]):
            result['index'].append({
                'code': str(row.iloc[0]),
                'name': str(row.iloc[1])
            })
    
    print(f'  发现 {len(result["index"])} 个指标分组')
    print('  (文件较大，仅提取目录结构)')
    
    with open(f'{output_dir}/enb_15min.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print('  已保存')
    return result

if __name__ == '__main__':
    print('='*50)
    print('开始提取无线网管数据字典')
    print('='*50)
    
    extract_gnb_1min()
    extract_gnb_15min()
    extract_kqi()
    extract_enb_1min()
    extract_enb_15min()
    
    print('\n' + '='*50)
    print('提取完成！')
    print('='*50)
