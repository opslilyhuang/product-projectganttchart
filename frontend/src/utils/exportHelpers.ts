/**
 * 甘特图导出工具函数
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * 导出甘特图为 PNG 图片
 */
export async function exportToPNG(): Promise<void> {
  const ganttContainer = document.querySelector('.gantt-container') as HTMLElement;
  if (!ganttContainer) {
    alert('无法找到甘特图容器');
    return;
  }

  try {
    const canvas = await html2canvas(ganttContainer, {
      backgroundColor: '#ffffff',
      scale: 2, // 提高清晰度
      logging: false,
    });

    // 创建下载链接
    const link = document.createElement('a');
    link.download = `gantt-chart-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('PNG导出失败:', error);
    alert('PNG导出失败，请重试');
  }
}

/**
 * 导出甘特图为 PDF
 */
export async function exportToPDF(): Promise<void> {
  const ganttContainer = document.querySelector('.gantt-container') as HTMLElement;
  if (!ganttContainer) {
    alert('无法找到甘特图容器');
    return;
  }

  try {
    const canvas = await html2canvas(ganttContainer, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 297; // A4 宽度（mm）
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // 创建 PDF（横向 A4）
    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // 如果图片高度超过一页，分页处理
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 210; // A4 高度

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 210;
    }

    pdf.save(`gantt-chart-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('PDF导出失败:', error);
    alert('PDF导出失败，请重试');
  }
}

/**
 * 打印甘特图
 */
export function printGantt(): void {
  window.print();
}
