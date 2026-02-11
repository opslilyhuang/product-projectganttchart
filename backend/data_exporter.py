#!/usr/bin/env python3
"""
数据导出工具 - 将 gantt_chart.py 中的任务数据转换为前端 JSON 格式
"""

import json
import sys
import os
from datetime import datetime

# Add parent directory to path to import gantt_chart
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from gantt_chart import tasks_list


def calculate_duration(start_str, end_str):
    """计算任务持续天数"""
    start = datetime.strptime(start_str, '%Y-%m-%d')
    end = datetime.strptime(end_str, '%Y-%m-%d')
    return (end - start).days + 1


def determine_status(progress):
    """根据进度确定任务状态"""
    if progress == 0:
        return 'planned'
    elif progress == 100:
        return 'completed'
    else:
        return 'in-progress'


def convert_tasks_to_json():
    """转换任务列表为前端JSON格式"""

    # Step 1: 收集所有模块
    modules = {}
    module_tasks = {}  # 记录每个模块的任务

    for task in tasks_list:
        module_name = task['module']
        if module_name not in modules:
            modules[module_name] = {
                'tasks': [],
                'start': task['start'],
                'end': task['end'],
                'phase': task['phase']
            }
            module_tasks[module_name] = []

        # 更新模块的开始和结束时间
        if task['start'] < modules[module_name]['start']:
            modules[module_name]['start'] = task['start']
        if task['end'] > modules[module_name]['end']:
            modules[module_name]['end'] = task['end']

        module_tasks[module_name].append(task)

    # Step 2: 生成输出数据
    output_tasks = []
    task_id_counter = 1

    # 生成模块和任务
    for module_name, module_info in modules.items():
        module_id = f"module-{task_id_counter}"
        task_id_counter += 1

        # 计算模块的总进度（所有任务的平均进度）
        module_progress = sum(t['progress'] for t in module_tasks[module_name]) / len(module_tasks[module_name]) / 100

        # 添加模块
        output_tasks.append({
            'id': module_id,
            'text': module_name,
            'type': 'project',  # DHTMLX Gantt uses 'project' for parent tasks
            'parent': None,
            'start_date': module_info['start'],
            'end_date': module_info['end'],
            'duration': calculate_duration(module_info['start'], module_info['end']),
            'progress': module_progress,
            'owner': '',
            'phase': module_info['phase'],
            'is_milestone': False,
            'priority': 'medium',
            'status': determine_status(int(module_progress * 100)),
            'open': True  # 展开模块
        })

        # 添加该模块下的所有任务
        for task in module_tasks[module_name]:
            task_id = f"task-{task_id_counter}"
            task_id_counter += 1

            output_tasks.append({
                'id': task_id,
                'text': task['task'],
                'type': 'task',
                'parent': module_id,
                'start_date': task['start'],
                'end_date': task['end'],
                'duration': calculate_duration(task['start'], task['end']),
                'progress': task['progress'] / 100,
                'owner': task['owner'],
                'phase': task['phase'],
                'is_milestone': task['is_milestone'],
                'priority': 'medium',
                'status': determine_status(task['progress']),
                'description': ''
            })

    # Step 3: 生成完整的输出对象
    output = {
        'tasks': output_tasks,
        'links': [],  # 初始没有依赖关系
        'config': {
            'view': 'month',
            'readonly': False,
            'showProgress': True,
            'showCriticalPath': False
        }
    }

    return output


def main():
    """主函数"""
    print("🔄 开始转换任务数据...")

    # 转换数据
    data = convert_tasks_to_json()

    # 确保输出目录存在
    output_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'frontend',
        'src',
        'data'
    )
    os.makedirs(output_dir, exist_ok=True)

    # 写入文件
    output_file = os.path.join(output_dir, 'initial-data.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"✅ 成功导出 {len(data['tasks'])} 个任务到: {output_file}")
    print(f"   - 模块数: {sum(1 for t in data['tasks'] if t['type'] == 'project')}")
    print(f"   - 任务数: {sum(1 for t in data['tasks'] if t['type'] == 'task')}")
    print(f"   - 里程碑: {sum(1 for t in data['tasks'] if t['is_milestone'])}")


if __name__ == '__main__':
    main()
