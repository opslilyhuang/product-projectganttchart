#!/usr/bin/env python3
"""
中源生物企业 AI 业务与决策系统 - 交互式甘特图
Interactive Gantt Chart for AI Project Planning 2026

技术栈: Python 3.10+, Pandas, Plotly
风格: 极简现代浅色系 (Gemini/GPT 风格)
"""

import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import webbrowser
import os

# ============================================================================
# 📝 可编辑数据区 - 在此处修改任务数据
# ============================================================================

tasks_list = [
    # ========== H1 增长飞轮 (1月-6月) - 柔和蓝色系 ==========

    # 1. AI 客服 (7x24h)
    {
        "module": "AI 客服 (7x24h)",
        "task": "数据调研接入",
        "start": "2026-01-15",
        "end": "2026-03-15",
        "owner": "产品/交付",
        "progress": 100,
        "phase": "H1",
        "is_milestone": False
    },
    {
        "module": "AI 客服 (7x24h)",
        "task": "技术咨询模块开发",
        "start": "2026-03-01",
        "end": "2026-05-01",
        "owner": "研发团队",
        "progress": 75,
        "phase": "H1",
        "is_milestone": False
    },
    {
        "module": "AI 客服 (7x24h)",
        "task": "系统集成与测试",
        "start": "2026-04-15",
        "end": "2026-05-15",
        "owner": "研发团队",
        "progress": 50,
        "phase": "H1",
        "is_milestone": False
    },
    {
        "module": "AI 客服 (7x24h)",
        "task": "试运行启动",
        "start": "2026-05-15",
        "end": "2026-05-15",
        "owner": "产品/交付",
        "progress": 0,
        "phase": "H1",
        "is_milestone": True
    },
    {
        "module": "AI 客服 (7x24h)",
        "task": "正式交付",
        "start": "2026-06-30",
        "end": "2026-06-30",
        "owner": "产品/交付",
        "progress": 0,
        "phase": "H1",
        "is_milestone": True
    },

    # 2. 产品智能推荐
    {
        "module": "产品智能推荐",
        "task": "客户画像数据扩充",
        "start": "2026-02-01",
        "end": "2026-04-01",
        "owner": "数据团队",
        "progress": 80,
        "phase": "H1",
        "is_milestone": False
    },
    {
        "module": "产品智能推荐",
        "task": "非结构化数据接入",
        "start": "2026-03-15",
        "end": "2026-05-01",
        "owner": "数据团队",
        "progress": 60,
        "phase": "H1",
        "is_milestone": False
    },
    {
        "module": "产品智能推荐",
        "task": "推荐算法训练优化",
        "start": "2026-04-15",
        "end": "2026-06-15",
        "owner": "数据团队",
        "progress": 30,
        "phase": "H1",
        "is_milestone": False
    },
    {
        "module": "产品智能推荐",
        "task": "正式交付",
        "start": "2026-06-30",
        "end": "2026-06-30",
        "owner": "产品/交付",
        "progress": 0,
        "phase": "H1",
        "is_milestone": True
    },

    # 3. 订单进度查询
    {
        "module": "订单进度查询",
        "task": "第三方物流API接入",
        "start": "2026-02-15",
        "end": "2026-04-15",
        "owner": "研发团队",
        "progress": 70,
        "phase": "H1",
        "is_milestone": False
    },
    {
        "module": "订单进度查询",
        "task": "自动化物流更新",
        "start": "2026-04-01",
        "end": "2026-06-01",
        "owner": "研发团队",
        "progress": 40,
        "phase": "H1",
        "is_milestone": False
    },
    {
        "module": "订单进度查询",
        "task": "正式交付",
        "start": "2026-06-30",
        "end": "2026-06-30",
        "owner": "产品/交付",
        "progress": 0,
        "phase": "H1",
        "is_milestone": True
    },

    # 4. AI 商机识别
    {
        "module": "AI 商机识别",
        "task": "NLP语义捕捉开发",
        "start": "2026-03-01",
        "end": "2026-05-01",
        "owner": "研发团队",
        "progress": 55,
        "phase": "H1",
        "is_milestone": False
    },
    {
        "module": "AI 商机识别",
        "task": "销售线索提取算法",
        "start": "2026-04-15",
        "end": "2026-06-15",
        "owner": "研发团队",
        "progress": 25,
        "phase": "H1",
        "is_milestone": False
    },
    {
        "module": "AI 商机识别",
        "task": "正式交付",
        "start": "2026-06-30",
        "end": "2026-06-30",
        "owner": "产品/交付",
        "progress": 0,
        "phase": "H1",
        "is_milestone": True
    },

    # 5. 智能问数助手 (超前落地)
    {
        "module": "智能问数助手",
        "task": "业务本体建模",
        "start": "2026-01-15",
        "end": "2026-03-15",
        "owner": "数据团队",
        "progress": 100,
        "phase": "H1",
        "is_milestone": False
    },
    {
        "module": "智能问数助手",
        "task": "用户权限体系联调",
        "start": "2026-03-15",
        "end": "2026-04-30",
        "owner": "数据团队",
        "progress": 85,
        "phase": "H1",
        "is_milestone": False
    },
    {
        "module": "智能问数助手",
        "task": "应用层搭建",
        "start": "2026-04-01",
        "end": "2026-05-10",
        "owner": "数据团队",
        "progress": 60,
        "phase": "H1",
        "is_milestone": False
    },
    {
        "module": "智能问数助手",
        "task": "试运行启动 (超前)",
        "start": "2026-05-15",
        "end": "2026-05-15",
        "owner": "产品/交付",
        "progress": 0,
        "phase": "H1",
        "is_milestone": True
    },

    # ========== H2 效率利剑 (7月-12月) - 柔和绿色系 ==========

    # 6. 内部知识库
    {
        "module": "内部知识库",
        "task": "培训文件整合",
        "start": "2026-07-01",
        "end": "2026-08-31",
        "owner": "产品/交付",
        "progress": 0,
        "phase": "H2",
        "is_milestone": False
    },
    {
        "module": "内部知识库",
        "task": "制度文档接入",
        "start": "2026-08-15",
        "end": "2026-10-15",
        "owner": "数据团队",
        "progress": 0,
        "phase": "H2",
        "is_milestone": False
    },
    {
        "module": "内部知识库",
        "task": "正式交付",
        "start": "2026-10-31",
        "end": "2026-10-31",
        "owner": "产品/交付",
        "progress": 0,
        "phase": "H2",
        "is_milestone": True
    },

    # 7. AI 补货提醒
    {
        "module": "AI 补货提醒",
        "task": "库存销售数据建模",
        "start": "2026-07-01",
        "end": "2026-09-01",
        "owner": "数据团队",
        "progress": 0,
        "phase": "H2",
        "is_milestone": False
    },
    {
        "module": "AI 补货提醒",
        "task": "主动预警系统开发",
        "start": "2026-08-15",
        "end": "2026-10-15",
        "owner": "研发团队",
        "progress": 0,
        "phase": "H2",
        "is_milestone": False
    },
    {
        "module": "AI 补货提醒",
        "task": "正式交付",
        "start": "2026-10-31",
        "end": "2026-10-31",
        "owner": "产品/交付",
        "progress": 0,
        "phase": "H2",
        "is_milestone": True
    },

    # 8. AI 付款提示
    {
        "module": "AI 付款提示",
        "task": "采购账期管理建模",
        "start": "2026-07-15",
        "end": "2026-09-15",
        "owner": "数据团队",
        "progress": 0,
        "phase": "H2",
        "is_milestone": False
    },
    {
        "module": "AI 付款提示",
        "task": "智能提醒功能开发",
        "start": "2026-09-01",
        "end": "2026-10-15",
        "owner": "研发团队",
        "progress": 0,
        "phase": "H2",
        "is_milestone": False
    },
    {
        "module": "AI 付款提示",
        "task": "正式交付",
        "start": "2026-10-31",
        "end": "2026-10-31",
        "owner": "产品/交付",
        "progress": 0,
        "phase": "H2",
        "is_milestone": True
    },

    # 9. AI 合同审核
    {
        "module": "AI 合同审核",
        "task": "风险条款规则库建设",
        "start": "2026-07-01",
        "end": "2026-09-01",
        "owner": "法务团队",
        "progress": 0,
        "phase": "H2",
        "is_milestone": False
    },
    {
        "module": "AI 合同审核",
        "task": "自动识别引擎开发",
        "start": "2026-08-15",
        "end": "2026-10-15",
        "owner": "研发团队",
        "progress": 0,
        "phase": "H2",
        "is_milestone": False
    },
    {
        "module": "AI 合同审核",
        "task": "正式交付",
        "start": "2026-10-31",
        "end": "2026-10-31",
        "owner": "产品/交付",
        "progress": 0,
        "phase": "H2",
        "is_milestone": True
    },

    # 10. AI 用户行为分析
    {
        "module": "AI 用户行为分析",
        "task": "行为数据采集建模",
        "start": "2026-09-01",
        "end": "2026-10-31",
        "owner": "数据团队",
        "progress": 0,
        "phase": "H2",
        "is_milestone": False
    },
    {
        "module": "AI 用户行为分析",
        "task": "系统体验优化分析",
        "start": "2026-10-15",
        "end": "2026-11-30",
        "owner": "数据团队",
        "progress": 0,
        "phase": "H2",
        "is_milestone": False
    },
    {
        "module": "AI 用户行为分析",
        "task": "正式交付",
        "start": "2026-12-15",
        "end": "2026-12-15",
        "owner": "产品/交付",
        "progress": 0,
        "phase": "H2",
        "is_milestone": True
    },

    # 11. AI 系统监控告警
    {
        "module": "AI 系统监控告警",
        "task": "数据质量保障体系",
        "start": "2026-09-15",
        "end": "2026-11-15",
        "owner": "研发团队",
        "progress": 0,
        "phase": "H2",
        "is_milestone": False
    },
    {
        "module": "AI 系统监控告警",
        "task": "系统稳定性监控",
        "start": "2026-10-15",
        "end": "2026-11-30",
        "owner": "研发团队",
        "progress": 0,
        "phase": "H2",
        "is_milestone": False
    },
    {
        "module": "AI 系统监控告警",
        "task": "正式交付",
        "start": "2026-12-15",
        "end": "2026-12-15",
        "owner": "产品/交付",
        "progress": 0,
        "phase": "H2",
        "is_milestone": True
    },
]

# 总里程碑
milestones = [
    {"name": "年会演示圆满完成", "date": "2026-01-31", "phase": "H1", "completed": True},
    {"name": "H1 试运行启动", "date": "2026-05-15", "phase": "H1", "completed": False},
    {"name": "H1 Launch 正式发布", "date": "2026-06-30", "phase": "H1", "completed": False},
    {"name": "H2 核心开发完成", "date": "2026-10-31", "phase": "H2", "completed": False},
    {"name": "年度总验收交付", "date": "2026-12-31", "phase": "H2", "completed": False},
]

# ============================================================================
# 🎨 配色方案
# ============================================================================

COLORS = {
    "H1": {
        "bar": "rgba(99, 149, 237, 0.8)",      # 柔和蓝
        "bar_light": "rgba(99, 149, 237, 0.4)",
        "milestone": "rgba(70, 130, 220, 1)",
    },
    "H2": {
        "bar": "rgba(102, 187, 106, 0.8)",     # 柔和绿
        "bar_light": "rgba(102, 187, 106, 0.4)",
        "milestone": "rgba(76, 175, 80, 1)",
    },
    "today": "rgba(239, 83, 80, 0.9)",          # 红色虚线
    "milestone_marker": "rgba(255, 193, 7, 1)", # 金色菱形
    "background": "#FAFAFA",                    # 极简浅灰
    "grid": "rgba(0, 0, 0, 0.06)",
    "text": "#424242",
    "text_light": "#757575",
}

# ============================================================================
# 📊 图表生成函数
# ============================================================================

def create_gantt_chart():
    """生成交互式甘特图"""

    df = pd.DataFrame(tasks_list)
    df['start'] = pd.to_datetime(df['start'])
    df['end'] = pd.to_datetime(df['end'])

    # 获取所有模块（保持顺序）
    modules = df['module'].unique().tolist()

    # 创建图表
    fig = go.Figure()

    # 当前日期
    today = datetime(2026, 2, 9)  # 使用指定的当前日期

    # 为每个模块创建任务条
    y_positions = {}
    y_counter = 0

    for module in reversed(modules):  # 反转以使第一个模块在顶部
        module_tasks = df[df['module'] == module]
        phase = module_tasks.iloc[0]['phase']

        for _, task in module_tasks.iterrows():
            task_name = task['task']
            y_label = f"{module}<br>  └ {task_name}" if not task['is_milestone'] else f"{module}<br>  ◆ {task_name}"

            if not task['is_milestone']:
                # 任务条
                duration = (task['end'] - task['start']).days
                if duration == 0:
                    duration = 1

                # 悬停信息
                hover_text = (
                    f"<b>{module}</b><br>"
                    f"<b>任务:</b> {task_name}<br>"
                    f"<b>开始:</b> {task['start'].strftime('%Y-%m-%d')}<br>"
                    f"<b>结束:</b> {task['end'].strftime('%Y-%m-%d')}<br>"
                    f"<b>负责人:</b> {task['owner']}<br>"
                    f"<b>进度:</b> {task['progress']}%"
                )

                # 背景条（总长度）
                fig.add_trace(go.Bar(
                    x=[duration],
                    y=[y_label],
                    orientation='h',
                    base=task['start'],
                    marker=dict(
                        color=COLORS[phase]['bar_light'],
                        line=dict(width=0)
                    ),
                    hoverinfo='skip',
                    showlegend=False,
                    name=f'{module} - {task_name} (背景)'
                ))

                # 进度条
                progress_duration = duration * task['progress'] / 100
                if progress_duration > 0:
                    fig.add_trace(go.Bar(
                        x=[progress_duration],
                        y=[y_label],
                        orientation='h',
                        base=task['start'],
                        marker=dict(
                            color=COLORS[phase]['bar'],
                            line=dict(width=0)
                        ),
                        hovertemplate=hover_text + "<extra></extra>",
                        showlegend=False,
                        name=f'{module} - {task_name}'
                    ))
                else:
                    # 添加一个透明的trace用于hover
                    fig.add_trace(go.Bar(
                        x=[duration],
                        y=[y_label],
                        orientation='h',
                        base=task['start'],
                        marker=dict(
                            color='rgba(0,0,0,0)',
                        ),
                        hovertemplate=hover_text + "<extra></extra>",
                        showlegend=False,
                        name=f'{module} - {task_name} (hover)'
                    ))
            else:
                # 里程碑标记（菱形）
                hover_text = (
                    f"<b>🎯 里程碑</b><br>"
                    f"<b>{module}</b><br>"
                    f"<b>{task_name}</b><br>"
                    f"<b>日期:</b> {task['start'].strftime('%Y-%m-%d')}<br>"
                    f"<b>负责人:</b> {task['owner']}"
                )

                fig.add_trace(go.Scatter(
                    x=[task['start']],
                    y=[y_label],
                    mode='markers',
                    marker=dict(
                        symbol='diamond',
                        size=14,
                        color=COLORS['milestone_marker'],
                        line=dict(width=2, color='rgba(255, 160, 0, 1)')
                    ),
                    hovertemplate=hover_text + "<extra></extra>",
                    showlegend=False,
                    name=f'{module} - {task_name} (里程碑)'
                ))

            y_counter += 1

    # 添加总里程碑标注
    for ms in milestones:
        ms_date = datetime.strptime(ms['date'], '%Y-%m-%d')
        fig.add_vline(
            x=ms_date.timestamp() * 1000,  # 转换为毫秒时间戳
            line=dict(
                color=COLORS['milestone_marker'] if not ms['completed'] else 'rgba(150, 150, 150, 0.5)',
                width=2,
                dash='dot'
            ),
            annotation=dict(
                text=f"◆ {ms['name']}",
                font=dict(size=10, color=COLORS['text']),
                textangle=-45,
                yanchor='bottom'
            )
        )

    # 添加当前日期红色虚线
    fig.add_vline(
        x=today.timestamp() * 1000,  # 转换为毫秒时间戳
        line=dict(color=COLORS['today'], width=2, dash='dash'),
        annotation=dict(
            text=f"📍 今日 ({today.strftime('%Y-%m-%d')})",
            font=dict(size=11, color=COLORS['today']),
            yanchor='bottom'
        )
    )

    # 更新布局
    fig.update_layout(
        title=dict(
            text="<b>中源生物 AI 业务与决策系统</b> - 2026年项目全景甘特图<br><sub>双节奏航线: H1 增长飞轮 (蓝) | H2 效率利剑 (绿)</sub>",
            font=dict(size=20, color=COLORS['text']),
            x=0.5,
            xanchor='center'
        ),
        barmode='overlay',
        plot_bgcolor=COLORS['background'],
        paper_bgcolor='white',
        font=dict(family="system-ui, -apple-system, sans-serif", color=COLORS['text']),
        height=max(800, y_counter * 28),
        margin=dict(l=300, r=50, t=120, b=80),
        xaxis=dict(
            title="时间轴",
            type='date',
            tickformat='%Y-%m',
            dtick='M1',
            range=['2026-01-01', '2027-01-15'],
            gridcolor=COLORS['grid'],
            showline=True,
            linecolor=COLORS['grid'],
        ),
        yaxis=dict(
            title="",
            automargin=True,
            tickfont=dict(size=11),
            gridcolor=COLORS['grid'],
        ),
        hoverlabel=dict(
            bgcolor='white',
            font_size=12,
            font_family="system-ui, -apple-system, sans-serif"
        ),
        legend=dict(
            orientation='h',
            yanchor='bottom',
            y=1.02,
            xanchor='right',
            x=1
        )
    )

    # 添加图例说明
    fig.add_trace(go.Bar(
        x=[None], y=[None],
        marker=dict(color=COLORS['H1']['bar']),
        name='H1 增长飞轮 (1-6月)',
        showlegend=True
    ))
    fig.add_trace(go.Bar(
        x=[None], y=[None],
        marker=dict(color=COLORS['H2']['bar']),
        name='H2 效率利剑 (7-12月)',
        showlegend=True
    ))
    fig.add_trace(go.Scatter(
        x=[None], y=[None],
        mode='markers',
        marker=dict(symbol='diamond', size=12, color=COLORS['milestone_marker']),
        name='里程碑',
        showlegend=True
    ))

    return fig


def create_module_summary_chart():
    """创建模块概览图（第一层级视图）"""

    df = pd.DataFrame(tasks_list)
    df['start'] = pd.to_datetime(df['start'])
    df['end'] = pd.to_datetime(df['end'])

    # 按模块汇总
    module_summary = df.groupby('module').agg({
        'start': 'min',
        'end': 'max',
        'progress': 'mean',
        'phase': 'first',
        'owner': lambda x: ', '.join(x.unique())
    }).reset_index()

    # 保持模块顺序
    module_order = [
        "AI 客服 (7x24h)", "产品智能推荐", "订单进度查询",
        "AI 商机识别", "智能问数助手",
        "内部知识库", "AI 补货提醒", "AI 付款提示",
        "AI 合同审核", "AI 用户行为分析", "AI 系统监控告警"
    ]
    module_summary['order'] = module_summary['module'].apply(lambda x: module_order.index(x) if x in module_order else 999)
    module_summary = module_summary.sort_values('order', ascending=False)

    fig = go.Figure()
    today = datetime(2026, 2, 9)

    for _, row in module_summary.iterrows():
        duration = (row['end'] - row['start']).days
        phase = row['phase']

        hover_text = (
            f"<b>{row['module']}</b><br>"
            f"<b>阶段:</b> {'H1 增长飞轮' if phase == 'H1' else 'H2 效率利剑'}<br>"
            f"<b>开始:</b> {row['start'].strftime('%Y-%m-%d')}<br>"
            f"<b>结束:</b> {row['end'].strftime('%Y-%m-%d')}<br>"
            f"<b>负责人:</b> {row['owner']}<br>"
            f"<b>平均进度:</b> {row['progress']:.0f}%<br>"
            f"<i>点击查看详细任务</i>"
        )

        # 背景条
        fig.add_trace(go.Bar(
            x=[duration],
            y=[row['module']],
            orientation='h',
            base=row['start'],
            marker=dict(
                color=COLORS[phase]['bar_light'],
                line=dict(width=1, color=COLORS[phase]['bar'])
            ),
            hoverinfo='skip',
            showlegend=False,
        ))

        # 进度条
        progress_duration = duration * row['progress'] / 100
        if progress_duration > 0:
            fig.add_trace(go.Bar(
                x=[progress_duration],
                y=[row['module']],
                orientation='h',
                base=row['start'],
                marker=dict(
                    color=COLORS[phase]['bar'],
                ),
                hovertemplate=hover_text + "<extra></extra>",
                showlegend=False,
            ))

    # 添加总里程碑
    for ms in milestones:
        ms_date = datetime.strptime(ms['date'], '%Y-%m-%d')
        fig.add_vline(
            x=ms_date.timestamp() * 1000,  # 转换为毫秒时间戳
            line=dict(
                color=COLORS['milestone_marker'],
                width=2,
                dash='dot'
            ),
            annotation=dict(
                text=f"◆ {ms['name']}",
                font=dict(size=10),
                textangle=-45,
            )
        )

    # 当前日期
    fig.add_vline(
        x=today.timestamp() * 1000,  # 转换为毫秒时间戳
        line=dict(color=COLORS['today'], width=2, dash='dash'),
        annotation=dict(
            text=f"📍 今日",
            font=dict(size=11, color=COLORS['today']),
        )
    )

    fig.update_layout(
        title=dict(
            text="<b>中源生物 AI 业务与决策系统</b> - 11大智能体模块概览<br><sub>点击模块名称可展开查看详细任务</sub>",
            font=dict(size=20, color=COLORS['text']),
            x=0.5,
        ),
        barmode='overlay',
        plot_bgcolor=COLORS['background'],
        paper_bgcolor='white',
        font=dict(family="system-ui, -apple-system, sans-serif", color=COLORS['text']),
        height=600,
        margin=dict(l=200, r=50, t=120, b=80),
        xaxis=dict(
            title="时间轴 (2026)",
            type='date',
            tickformat='%m月',
            dtick='M1',
            range=['2026-01-01', '2027-01-15'],
            gridcolor=COLORS['grid'],
        ),
        yaxis=dict(
            title="",
            tickfont=dict(size=12),
            gridcolor=COLORS['grid'],
        ),
        hoverlabel=dict(
            bgcolor='white',
            font_size=12,
        ),
    )

    # 图例
    fig.add_trace(go.Bar(x=[None], y=[None], marker=dict(color=COLORS['H1']['bar']), name='H1 增长飞轮', showlegend=True))
    fig.add_trace(go.Bar(x=[None], y=[None], marker=dict(color=COLORS['H2']['bar']), name='H2 效率利剑', showlegend=True))

    return fig


def generate_html():
    """生成包含两层视图的交互式HTML"""

    fig_summary = create_module_summary_chart()
    fig_detail = create_gantt_chart()

    # 将两个图表合并到一个HTML中
    html_content = f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>中源生物 AI 项目甘特图 2026</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        .container {{
            max-width: 1600px;
            margin: 0 auto;
        }}
        .header {{
            text-align: center;
            padding: 30px 20px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            margin-bottom: 24px;
        }}
        .header h1 {{
            color: #1a1a2e;
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 8px;
        }}
        .header p {{
            color: #666;
            font-size: 14px;
        }}
        .tabs {{
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
            justify-content: center;
        }}
        .tab {{
            padding: 12px 28px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            background: white;
            color: #666;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }}
        .tab:hover {{
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }}
        .tab.active {{
            background: linear-gradient(135deg, #6395ed 0%, #5a85d9 100%);
            color: white;
        }}
        .chart-container {{
            background: white;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            margin-bottom: 20px;
        }}
        .chart {{
            display: none;
        }}
        .chart.active {{
            display: block;
        }}
        .legend-bar {{
            display: flex;
            justify-content: center;
            gap: 32px;
            padding: 16px;
            background: white;
            border-radius: 12px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }}
        .legend-item {{
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #555;
        }}
        .legend-color {{
            width: 20px;
            height: 12px;
            border-radius: 3px;
        }}
        .legend-color.h1 {{ background: rgba(99, 149, 237, 0.8); }}
        .legend-color.h2 {{ background: rgba(102, 187, 106, 0.8); }}
        .legend-color.milestone {{ background: rgba(255, 193, 7, 1); width: 12px; height: 12px; transform: rotate(45deg); }}
        .legend-color.today {{ background: transparent; border: 2px dashed rgba(239, 83, 80, 0.9); width: 0; height: 16px; }}
        .footer {{
            text-align: center;
            padding: 20px;
            color: #999;
            font-size: 12px;
        }}
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
        }}
        .stat-card {{
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            text-align: center;
        }}
        .stat-value {{
            font-size: 32px;
            font-weight: 600;
            color: #1a1a2e;
        }}
        .stat-label {{
            font-size: 13px;
            color: #888;
            margin-top: 4px;
        }}
        .stat-card.h1 .stat-value {{ color: #6395ed; }}
        .stat-card.h2 .stat-value {{ color: #66bb6a; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>中源生物企业 AI 业务与决策系统</h1>
            <p>2026年项目全景甘特图 | 双节奏航线战略规划</p>
        </div>

        <div class="stats">
            <div class="stat-card h1">
                <div class="stat-value">5</div>
                <div class="stat-label">H1 增长飞轮模块</div>
            </div>
            <div class="stat-card h2">
                <div class="stat-value">6</div>
                <div class="stat-label">H2 效率利剑模块</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">11</div>
                <div class="stat-label">智能体总数</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">5</div>
                <div class="stat-label">关键里程碑</div>
            </div>
        </div>

        <div class="legend-bar">
            <div class="legend-item">
                <div class="legend-color h1"></div>
                <span>H1 增长飞轮 (1-6月)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color h2"></div>
                <span>H2 效率利剑 (7-12月)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color milestone"></div>
                <span>里程碑</span>
            </div>
            <div class="legend-item">
                <div class="legend-color today"></div>
                <span>今日</span>
            </div>
        </div>

        <div class="tabs">
            <button class="tab active" onclick="showChart('summary')">模块概览</button>
            <button class="tab" onclick="showChart('detail')">详细任务</button>
        </div>

        <div class="chart-container">
            <div id="summary-chart" class="chart active"></div>
            <div id="detail-chart" class="chart"></div>
        </div>

        <div class="footer">
            <p>生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M')} | 数据来源: AI项目管理系统</p>
        </div>
    </div>

    <script>
        // 模块概览图
        var summaryData = {fig_summary.to_json()};
        Plotly.newPlot('summary-chart', summaryData.data, summaryData.layout, {{responsive: true}});

        // 详细任务图
        var detailData = {fig_detail.to_json()};
        Plotly.newPlot('detail-chart', detailData.data, detailData.layout, {{responsive: true}});

        function showChart(chartType) {{
            document.querySelectorAll('.chart').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

            document.getElementById(chartType + '-chart').classList.add('active');
            event.target.classList.add('active');

            // 触发resize以确保图表正确渲染
            window.dispatchEvent(new Event('resize'));
        }}
    </script>
</body>
</html>
"""

    return html_content


def main():
    """主函数：生成并打开甘特图"""
    print("🚀 正在生成 AI 项目甘特图...")

    # 生成HTML
    html_content = generate_html()

    # 保存文件
    output_file = "AI_Project_Gantt_2026.html"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"✅ 甘特图已生成: {output_file}")

    # 自动打开浏览器
    file_path = os.path.abspath(output_file)
    webbrowser.open(f'file://{file_path}')
    print(f"🌐 已在浏览器中打开")

    # 打印任务统计
    df = pd.DataFrame(tasks_list)
    print(f"\n📊 项目统计:")
    print(f"   - 总任务数: {len(df)}")
    print(f"   - H1 任务: {len(df[df['phase']=='H1'])}")
    print(f"   - H2 任务: {len(df[df['phase']=='H2'])}")
    print(f"   - 里程碑数: {len(df[df['is_milestone']==True])}")
    print(f"   - 总里程碑: {len(milestones)}")


if __name__ == "__main__":
    main()
