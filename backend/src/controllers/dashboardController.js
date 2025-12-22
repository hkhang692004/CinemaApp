import dashboardService from '../services/dashboardService.js';
import ManagerTheater from '../models/ManagerTheater.js';
import Role from '../models/Role.js';

// Helper function to get manager's theater IDs
async function getManagerTheaterIds(user) {
  const role = await Role.findByPk(user.role_id);
  if (role?.name === 'manager') {
    const assignments = await ManagerTheater.findAll({
      where: { user_id: user.id },
      attributes: ['theater_id']
    });
    return assignments.map(a => a.theater_id);
  }
  return null; // null means admin (no filter)
}

class DashboardController {
  // GET /api/dashboard/stats
  async getStats(req, res) {
    try {
      const theaterIds = await getManagerTheaterIds(req.user);
      const stats = await dashboardService.getStats(theaterIds);
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
      const theaterIds = await getManagerTheaterIds(req.user);
      const orders = await dashboardService.getRecentOrders(limit, theaterIds);
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
      const theaterIds = await getManagerTheaterIds(req.user);
      const chart = await dashboardService.getRevenueChart(days, theaterIds);
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
      const theaterIds = await getManagerTheaterIds(req.user);
      const movies = await dashboardService.getTopMovies(limit, theaterIds);
      res.json({ movies });
    } catch (error) {
      console.error('Top movies error:', error);
      res.status(500).json({ message: 'Lỗi khi lấy phim bán chạy' });
    }
  }
}

export default new DashboardController();
