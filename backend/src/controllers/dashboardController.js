import dashboardService from '../services/dashboardService.js';

class DashboardController {
  // GET /api/dashboard/stats
  async getStats(req, res) {
    try {
      const stats = await dashboardService.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: 'Lỗi khi lấy thống kê' });
    }
  }

  // GET /api/dashboard/recent-orders
  async getRecentOrders(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const orders = await dashboardService.getRecentOrders(limit);
      res.json({ orders });
    } catch (error) {
      console.error('Recent orders error:', error);
      res.status(500).json({ message: 'Lỗi khi lấy đơn hàng gần đây' });
    }
  }

  // GET /api/dashboard/revenue-chart
  async getRevenueChart(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      const chart = await dashboardService.getRevenueChart(days);
      res.json({ chart });
    } catch (error) {
      console.error('Revenue chart error:', error);
      res.status(500).json({ message: 'Lỗi khi lấy biểu đồ doanh thu' });
    }
  }

  // GET /api/dashboard/top-movies
  async getTopMovies(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const movies = await dashboardService.getTopMovies(limit);
      res.json({ movies });
    } catch (error) {
      console.error('Top movies error:', error);
      res.status(500).json({ message: 'Lỗi khi lấy phim bán chạy' });
    }
  }
}

export default new DashboardController();
