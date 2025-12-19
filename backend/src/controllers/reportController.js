import { reportService } from '../services/reportService.js';

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
