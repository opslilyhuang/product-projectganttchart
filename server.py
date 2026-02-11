#!/usr/bin/env python3
"""
简单的Web服务器，用于托管AI项目甘特图
端口: 3003
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

PORT = 3003
DIRECTORY = Path(__file__).parent

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

    def end_headers(self):
        # 添加CORS头，允许跨域访问
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_GET(self):
        # 如果访问根路径，重定向到甘特图
        if self.path == '/':
            self.path = '/AI_Project_Gantt_2026.html'
        return super().do_GET()

def main():
    # 确保甘特图存在
    gantt_file = DIRECTORY / 'AI_Project_Gantt_2026.html'
    if not gantt_file.exists():
        print("⚠️  甘特图文件不存在，正在生成...")
        os.system('python3 gantt_chart.py')

    # 启动服务器
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"\n{'='*60}")
        print(f"🚀 AI项目甘特图服务器已启动")
        print(f"{'='*60}")
        print(f"📊 访问地址: http://localhost:{PORT}")
        print(f"📂 服务目录: {DIRECTORY}")
        print(f"\n按 Ctrl+C 停止服务器")
        print(f"{'='*60}\n")

        # 自动打开浏览器
        webbrowser.open(f'http://localhost:{PORT}')

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✅ 服务器已停止")

if __name__ == "__main__":
    main()
