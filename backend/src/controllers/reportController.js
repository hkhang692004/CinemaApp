import { reportService } from '../services/reportService.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Font paths
const FONT_REGULAR = path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf');
const FONT_BOLD = path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf');

// Helper format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN');
};

export const getOverviewReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Thiếu startDate hoặc endDate' });
    }

    const report = await reportService.getOverviewReport(startDate, endDate);
    return res.status(200).json(report);
  } catch (error) {
    console.error('Error getting overview report:', error);
    return res.status(500).json({ message: error.message || 'Lỗi hệ thống' });
  }
};

export const getTheaterReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Thiếu startDate hoặc endDate' });
    }

    const report = await reportService.getTheaterReport(startDate, endDate);
    return res.status(200).json({ theaters: report });
  } catch (error) {
    console.error('Error getting theater report:', error);
    return res.status(500).json({ message: error.message || 'Lỗi hệ thống' });
  }
};

export const getMovieReport = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Thiếu startDate hoặc endDate' });
    }

    const report = await reportService.getMovieReport(startDate, endDate, parseInt(limit));
    return res.status(200).json({ movies: report });
  } catch (error) {
    console.error('Error getting movie report:', error);
    return res.status(500).json({ message: error.message || 'Lỗi hệ thống' });
  }
};

export const getMonthlyComparison = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const report = await reportService.getMonthlyComparison(parseInt(year));
    return res.status(200).json({ months: report, year: parseInt(year) });
  } catch (error) {
    console.error('Error getting monthly comparison:', error);
    return res.status(500).json({ message: error.message || 'Lỗi hệ thống' });
  }
};

export const triggerAggregation = async (req, res) => {
  try {
    const { date } = req.body;
    
    const success = await reportService.triggerAggregation(date);
    
    if (success) {
      return res.status(200).json({ message: 'Tổng hợp thống kê thành công' });
    } else {
      return res.status(500).json({ message: 'Tổng hợp thống kê thất bại' });
    }
  } catch (error) {
    console.error('Error triggering aggregation:', error);
    return res.status(500).json({ message: error.message || 'Lỗi hệ thống' });
  }
};
export const exportReport = async (req, res) => {
  try {
    const { type, startDate, endDate, year, format = 'csv' } = req.query;
    
    let data;
    let filename;
    
    switch (type) {
      case 'overview':
        if (!startDate || !endDate) {
          return res.status(400).json({ message: 'Thiếu startDate hoặc endDate' });
        }
        data = await reportService.getOverviewReport(startDate, endDate);
        filename = `bao-cao-tong-quan_${startDate}_${endDate}`;
        break;
      case 'theaters':
        if (!startDate || !endDate) {
          return res.status(400).json({ message: 'Thiếu startDate hoặc endDate' });
        }
        data = await reportService.getTheaterReport(startDate, endDate);
        filename = `bao-cao-theo-rap_${startDate}_${endDate}`;
        break;
      case 'movies':
        if (!startDate || !endDate) {
          return res.status(400).json({ message: 'Thiếu startDate hoặc endDate' });
        }
        data = await reportService.getMovieReport(startDate, endDate, 100);
        filename = `bao-cao-theo-phim_${startDate}_${endDate}`;
        break;
      case 'monthly':
        const reportYear = parseInt(year) || new Date().getFullYear();
        data = await reportService.getMonthlyComparison(reportYear);
        filename = `bao-cao-theo-thang_${reportYear}`;
        break;
      default:
        return res.status(400).json({ message: 'Loại báo cáo không hợp lệ' });
    }

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      
      const doc = generatePDF(type, data, { startDate, endDate, year });
      doc.pipe(res);
      doc.end();
      return;
    }

    if (format === 'csv') {
      const csv = convertToCSV(type, data);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      // Add BOM for Excel UTF-8 support
      return res.send('\uFEFF' + csv);
    }

    // JSON format
    return res.json(data);
  } catch (error) {
    console.error('Error exporting report:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi xuất báo cáo' });
  }
};

function convertToCSV(type, data) {
  switch (type) {
    case 'overview':
      return convertOverviewToCSV(data);
    case 'theaters':
      return convertTheatersToCSV(data);
    case 'movies':
      return convertMoviesToCSV(data);
    case 'monthly':
      return convertMonthlyToCSV(data);
    default:
      return '';
  }
}

function convertOverviewToCSV(data) {
  let csv = 'BÁO CÁO TỔNG QUAN\n\n';
  csv += 'Chỉ số,Giá trị\n';
  csv += `Tổng doanh thu,${data.totalRevenue}\n`;
  csv += `Doanh thu đặt vé,${data.totalOrderRevenue}\n`;
  csv += `Doanh thu đặt nhóm,${data.totalGroupRevenue}\n`;
  csv += `Tổng đơn hàng,${data.totalOrders}\n`;
  csv += `Tổng đặt nhóm,${data.totalGroupBookings}\n`;
  csv += `Tổng vé bán,${data.totalTickets}\n`;
  csv += `Số khách hàng,${data.totalCustomers}\n`;
  csv += `Số khách đoàn,${data.totalGroupGuests}\n`;
  
  csv += '\n\nDOANH THU THEO NGÀY\n';
  csv += 'Ngày,Tổng doanh thu,Doanh thu vé,Doanh thu nhóm,Số đơn,Số khách\n';
  data.dailyData?.forEach(d => {
    csv += `${d.date},${d.revenue},${d.orderRevenue},${d.groupRevenue},${d.orders},${d.customers}\n`;
  });
  
  return csv;
}

function convertTheatersToCSV(data) {
  let csv = 'BÁO CÁO THEO RẠP\n\n';
  csv += 'Tên rạp,Địa chỉ,Doanh thu,Số đơn,Số vé,Số khách\n';
  data.forEach(t => {
    csv += `"${t.theaterName}","${t.address}",${t.revenue},${t.orders},${t.tickets},${t.customers}\n`;
  });
  return csv;
}

function convertMoviesToCSV(data) {
  let csv = 'BÁO CÁO THEO PHIM\n\n';
  csv += 'Tên phim,Doanh thu,Số đơn,Số vé,Số khách\n';
  data.forEach(m => {
    csv += `"${m.title}",${m.revenue},${m.orders},${m.tickets},${m.customers}\n`;
  });
  return csv;
}

function convertMonthlyToCSV(data) {
  let csv = 'BÁO CÁO THEO THÁNG\n\n';
  csv += 'Tháng,Doanh thu,Số đơn\n';
  data.forEach(m => {
    csv += `${m.monthName},${m.revenue},${m.orders}\n`;
  });
  return csv;
}

// ==================== PDF Generation ====================

function generatePDF(type, data, params) {
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    bufferPages: true
  });
  
  // Register Vietnamese fonts
  doc.registerFont('Vietnamese', FONT_REGULAR);
  doc.registerFont('Vietnamese-Bold', FONT_BOLD);
  
  // Set default font
  doc.font('Vietnamese');
  
  switch (type) {
    case 'overview':
      generateOverviewPDF(doc, data, params);
      break;
    case 'theaters':
      generateTheatersPDF(doc, data, params);
      break;
    case 'movies':
      generateMoviesPDF(doc, data, params);
      break;
    case 'monthly':
      generateMonthlyPDF(doc, data, params);
      break;
  }
  
  return doc;
}

function generateOverviewPDF(doc, data, { startDate, endDate }) {
  // Title
  doc.font('Vietnamese-Bold').fontSize(20).text('BÁO CÁO TỔNG QUAN', { align: 'center' });
  doc.font('Vietnamese').fontSize(12).text(`Từ ${formatDate(startDate)} đến ${formatDate(endDate)}`, { align: 'center' });
  doc.moveDown(2);
  
  // Summary stats
  doc.font('Vietnamese-Bold').fontSize(14).text('THỐNG KÊ TỔNG HỢP', { underline: true });
  doc.moveDown();
  
  const stats = [
    ['Tổng doanh thu:', formatCurrency(data.totalRevenue)],
    ['Doanh thu đặt vé:', formatCurrency(data.totalOrderRevenue)],
    ['Doanh thu đặt nhóm:', formatCurrency(data.totalGroupRevenue)],
    ['Tổng đơn hàng:', data.totalOrders?.toString() || '0'],
    ['Tổng đặt nhóm:', data.totalGroupBookings?.toString() || '0'],
    ['Tổng vé bán:', data.totalTickets?.toString() || '0'],
    ['Số khách hàng:', data.totalCustomers?.toString() || '0'],
  ];
  
  doc.font('Vietnamese');
  stats.forEach(([label, value]) => {
    doc.fontSize(11).text(`${label} ${value}`);
  });
  
  doc.moveDown(2);
  
  // Daily data table
  if (data.dailyData?.length > 0) {
    doc.font('Vietnamese-Bold').fontSize(14).text('DOANH THU THEO NGÀY', { underline: true });
    doc.moveDown();
    
    // Line Chart for daily revenue
    const dailyData = data.dailyData.slice(0, 14); // Max 14 days for chart
    if (dailyData.length > 1) {
      const maxRevenue = Math.max(...dailyData.map(d => d.revenue || 0), 1);
      const chartTop = doc.y;
      const chartHeight = 100;
      const chartWidth = 450;
      const pointSpacing = chartWidth / (dailyData.length - 1);
      
      doc.font('Vietnamese').fontSize(10).text('Biểu đồ doanh thu theo ngày', 50, chartTop);
      
      const chartStartY = chartTop + 20;
      
      // Draw chart area border
      doc.rect(50, chartStartY, chartWidth, chartHeight).stroke('#e5e7eb');
      
      // Draw line chart
      doc.strokeColor('#ef4444').lineWidth(2);
      dailyData.forEach((d, i) => {
        const x = 50 + i * pointSpacing;
        const y = chartStartY + chartHeight - ((d.revenue / maxRevenue) * (chartHeight - 10)) - 5;
        
        if (i === 0) {
          doc.moveTo(x, y);
        } else {
          doc.lineTo(x, y);
        }
      });
      doc.stroke();
      
      // Draw points
      dailyData.forEach((d, i) => {
        const x = 50 + i * pointSpacing;
        const y = chartStartY + chartHeight - ((d.revenue / maxRevenue) * (chartHeight - 10)) - 5;
        doc.circle(x, y, 3).fill('#ef4444');
      });
      
      // X-axis labels - show all dates
      doc.fillColor('#333').fontSize(7);
      dailyData.forEach((d, i) => {
        const x = 50 + i * pointSpacing;
        const dateStr = formatDate(d.date);
        const shortDate = dateStr.slice(0, 5); // dd/mm
        // Center the label under the point
        doc.text(shortDate, x - 12, chartStartY + chartHeight + 5, { width: 30, align: 'center' });
      });
      
      doc.fillColor('#000');
      doc.y = chartStartY + chartHeight + 25;
      doc.moveDown();
    }
    
    // Table header
    const tableTop = doc.y;
    const colWidths = [80, 100, 100, 100, 50];
    const headers = ['Ngày', 'Tổng DT', 'DT Vé', 'DT Nhóm', 'Đơn'];
    
    doc.fontSize(10).font('Vietnamese-Bold');
    let xPos = 50;
    headers.forEach((header, i) => {
      doc.text(header, xPos, tableTop, { width: colWidths[i] });
      xPos += colWidths[i];
    });
    
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    
    // Table rows
    doc.font('Vietnamese');
    let yPos = tableTop + 20;
    
    data.dailyData.slice(0, 25).forEach((d) => {
      if (yPos > 750) {
        doc.addPage();
        yPos = 50;
      }
      
      xPos = 50;
      const row = [
        formatDate(d.date),
        formatCurrency(d.revenue),
        formatCurrency(d.orderRevenue),
        formatCurrency(d.groupRevenue),
        d.orders?.toString() || '0'
      ];
      
      row.forEach((cell, i) => {
        doc.fontSize(9).text(cell, xPos, yPos, { width: colWidths[i] });
        xPos += colWidths[i];
      });
      
      yPos += 18;
    });
  }
  
  // Footer
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc.font('Vietnamese').fontSize(8).text(
      `Trang ${i + 1}/${pageCount} - Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}`,
      50, 780, { align: 'center' }
    );
  }
}

function generateTheatersPDF(doc, data, { startDate, endDate }) {
  doc.font('Vietnamese-Bold').fontSize(20).text('BÁO CÁO THEO RẠP', { align: 'center' });
  doc.font('Vietnamese').fontSize(12).text(`Từ ${formatDate(startDate)} đến ${formatDate(endDate)}`, { align: 'center' });
  doc.moveDown(2);
  
  if (data.length === 0) {
    doc.text('Không có dữ liệu');
    return;
  }
  
  // Bar Chart
  const maxRevenue = Math.max(...data.map(t => t.revenue || 0), 1);
  const chartTop = doc.y;
  const chartHeight = 120;
  const chartWidth = 450;
  const barWidth = Math.min(40, chartWidth / data.length - 5);
  
  doc.font('Vietnamese-Bold').fontSize(12).text('Biểu đồ doanh thu theo rạp', 50, chartTop);
  
  const barStartY = chartTop + 25;
  data.slice(0, 10).forEach((t, i) => {
    const barHeight = (t.revenue / maxRevenue) * (chartHeight - 30);
    const x = 50 + i * (barWidth + 8);
    const y = barStartY + chartHeight - 30 - barHeight;
    
    // Bar
    doc.rect(x, y, barWidth, barHeight).fill('#ef4444');
    
    // Label
    doc.font('Vietnamese').fontSize(6).fillColor('#333')
      .text(`R${i + 1}`, x, barStartY + chartHeight - 25, { width: barWidth, align: 'center' });
  });
  
  doc.fillColor('#000');
  doc.y = barStartY + chartHeight + 10;
  doc.moveDown();
  
  // Table
  const colWidths = [30, 200, 100, 80, 40, 40];
  const headers = ['#', 'Tên rạp', 'Tổng DT', 'DT Nhóm', 'Vé', 'Đơn'];
  
  let tableTop = doc.y;
  doc.fontSize(10).font('Vietnamese-Bold');
  let xPos = 50;
  headers.forEach((header, i) => {
    doc.text(header, xPos, tableTop, { width: colWidths[i] });
    xPos += colWidths[i];
  });
  
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
  
  doc.font('Vietnamese');
  let yPos = tableTop + 20;
  
  data.forEach((t, index) => {
    if (yPos > 750) {
      doc.addPage();
      yPos = 50;
    }
    
    xPos = 50;
    const row = [
      (index + 1).toString(),
      t.theaterName || '',
      formatCurrency(t.revenue),
      formatCurrency(t.groupRevenue || 0),
      t.tickets?.toString() || '0',
      t.orders?.toString() || '0'
    ];
    
    row.forEach((cell, i) => {
      doc.fontSize(8).text(cell, xPos, yPos, { width: colWidths[i], ellipsis: true });
      xPos += colWidths[i];
    });
    
    yPos += 18;
  });
  
  // Total row
  doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
  yPos += 5;
  doc.font('Vietnamese-Bold');
  doc.text('TỔNG:', 50, yPos);
  doc.text(formatCurrency(data.reduce((sum, t) => sum + (t.revenue || 0), 0)), 280, yPos);
}

function generateMoviesPDF(doc, data, { startDate, endDate }) {
  doc.font('Vietnamese-Bold').fontSize(20).text('BÁO CÁO THEO PHIM', { align: 'center' });
  doc.font('Vietnamese').fontSize(12).text(`Từ ${formatDate(startDate)} đến ${formatDate(endDate)}`, { align: 'center' });
  doc.moveDown(2);
  
  if (data.length === 0) {
    doc.text('Không có dữ liệu');
    return;
  }
  
  // Bar Chart - Top 10 phim
  const top10 = data.slice(0, 10);
  const maxRevenue = Math.max(...top10.map(m => m.revenue || 0), 1);
  const chartTop = doc.y;
  const chartHeight = 120;
  const barWidth = 40;
  
  doc.font('Vietnamese-Bold').fontSize(12).text('Biểu đồ doanh thu Top 10 phim', 50, chartTop);
  
  const barStartY = chartTop + 25;
  top10.forEach((m, i) => {
    const barHeight = (m.revenue / maxRevenue) * (chartHeight - 30);
    const x = 50 + i * (barWidth + 8);
    const y = barStartY + chartHeight - 30 - barHeight;
    
    // Bar
    doc.rect(x, y, barWidth, barHeight).fill('#3b82f6');
    
    // Label
    doc.font('Vietnamese').fontSize(6).fillColor('#333')
      .text(`P${i + 1}`, x, barStartY + chartHeight - 25, { width: barWidth, align: 'center' });
  });
  
  doc.fillColor('#000');
  doc.y = barStartY + chartHeight + 10;
  doc.moveDown();
  
  // Table
  const colWidths = [30, 200, 100, 80, 40, 40];
  const headers = ['#', 'Tên phim', 'Tổng DT', 'DT Nhóm', 'Vé', 'Đơn'];
  
  let tableTop = doc.y;
  doc.fontSize(10).font('Vietnamese-Bold');
  let xPos = 50;
  headers.forEach((header, i) => {
    doc.text(header, xPos, tableTop, { width: colWidths[i] });
    xPos += colWidths[i];
  });
  
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
  
  doc.font('Vietnamese');
  let yPos = tableTop + 20;
  
  data.forEach((m, index) => {
    if (yPos > 750) {
      doc.addPage();
      yPos = 50;
    }
    
    xPos = 50;
    const row = [
      (index + 1).toString(),
      m.title || '',
      formatCurrency(m.revenue),
      formatCurrency(m.groupRevenue || 0),
      m.tickets?.toString() || '0',
      m.orders?.toString() || '0'
    ];
    
    row.forEach((cell, i) => {
      doc.fontSize(8).text(cell, xPos, yPos, { width: colWidths[i], ellipsis: true });
      xPos += colWidths[i];
    });
    
    yPos += 18;
  });
  
  // Total
  doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
  yPos += 5;
  doc.font('Vietnamese-Bold');
  doc.text('TỔNG:', 50, yPos);
  doc.text(formatCurrency(data.reduce((sum, m) => sum + (m.revenue || 0), 0)), 280, yPos);
}

function generateMonthlyPDF(doc, data, { year }) {
  doc.font('Vietnamese-Bold').fontSize(20).text('BÁO CÁO THEO THÁNG', { align: 'center' });
  doc.font('Vietnamese').fontSize(12).text(`Năm ${year}`, { align: 'center' });
  doc.moveDown(2);
  
  // Summary
  const totalRevenue = data.reduce((sum, m) => sum + (m.revenue || 0), 0);
  const totalOrderRevenue = data.reduce((sum, m) => sum + (m.orderRevenue || 0), 0);
  const totalGroupRevenue = data.reduce((sum, m) => sum + (m.groupRevenue || 0), 0);
  const totalOrders = data.reduce((sum, m) => sum + (m.orders || 0), 0);
  
  doc.fontSize(11).font('Vietnamese-Bold');
  doc.text(`Tổng doanh thu: ${formatCurrency(totalRevenue)}`);
  doc.text(`Doanh thu vé: ${formatCurrency(totalOrderRevenue)}`);
  doc.text(`Doanh thu nhóm: ${formatCurrency(totalGroupRevenue)}`);
  doc.text(`Tổng đơn hàng: ${totalOrders}`);
  doc.moveDown(1.5);
  
  // Bar Chart - 12 tháng
  const maxRevenue = Math.max(...data.map(m => m.revenue || 0), 1);
  const chartTop = doc.y;
  const chartHeight = 130;
  const barWidth = 35;
  
  doc.font('Vietnamese-Bold').fontSize(12).text('Biểu đồ doanh thu theo tháng', 50, chartTop);
  
  const barStartY = chartTop + 25;
  data.forEach((m, i) => {
    const barHeight = (m.revenue / maxRevenue) * (chartHeight - 35);
    const x = 50 + i * (barWidth + 6);
    const y = barStartY + chartHeight - 35 - barHeight;
    
    // Bar
    doc.rect(x, y, barWidth, barHeight).fill('#10b981');
    
    // Label
    doc.font('Vietnamese').fontSize(7).fillColor('#333')
      .text(`T${m.month}`, x, barStartY + chartHeight - 30, { width: barWidth, align: 'center' });
  });
  
  doc.fillColor('#000');
  doc.y = barStartY + chartHeight + 5;
  doc.moveDown();
  
  // Table
  const colWidths = [80, 110, 100, 100, 60];
  const headers = ['Tháng', 'Tổng DT', 'DT Vé', 'DT Nhóm', 'Đơn'];
  
  let tableTop = doc.y;
  doc.fontSize(10).font('Vietnamese-Bold');
  let xPos = 50;
  headers.forEach((header, i) => {
    doc.text(header, xPos, tableTop, { width: colWidths[i] });
    xPos += colWidths[i];
  });
  
  doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();
  
  doc.font('Vietnamese');
  let yPos = tableTop + 20;
  
  data.forEach((m) => {
    xPos = 50;
    const row = [
      `Tháng ${m.month}`,
      formatCurrency(m.revenue),
      formatCurrency(m.orderRevenue || 0),
      formatCurrency(m.groupRevenue || 0),
      m.orders?.toString() || '0'
    ];
    
    row.forEach((cell, i) => {
      doc.fontSize(9).text(cell, xPos, yPos, { width: colWidths[i] });
      xPos += colWidths[i];
    });
    
    yPos += 18;
  });
}