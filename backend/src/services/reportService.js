import { Op } from 'sequelize';
import { 
  DailyStatistic, 
  Order, 
  Ticket, 
  Movie, 
  Theater, 
  User,
  Showtime,
  sequelize 
} from '../models/index.js';
import { aggregateDailyStats } from '../jobs/updateShowtimeStatus.js';

export const reportService = {
  /**
   * Lấy báo cáo tổng quan theo khoảng thời gian
   */
  async getOverviewReport(startDate, endDate) {
    // Thử lấy từ DailyStatistic trước
    const dailyStats = await DailyStatistic.findAll({
      where: {
        stat_date: { [Op.between]: [startDate, endDate] },
        theater_id: null,
        movie_id: null
      },
      order: [['stat_date', 'ASC']]
    });

    // Nếu có data trong DailyStatistic, dùng nó
    if (dailyStats.length > 0) {
      const totals = dailyStats.reduce((acc, stat) => ({
        totalRevenue: acc.totalRevenue + parseFloat(stat.total_revenue || 0),
        totalTickets: acc.totalTickets + parseInt(stat.total_tickets_sold || 0),
        totalCustomers: acc.totalCustomers + parseInt(stat.unique_customers || 0)
      }), { totalRevenue: 0, totalTickets: 0, totalCustomers: 0 });

      return {
        ...totals,
        totalOrders: dailyStats.length > 0 ? await this.getOrderCount(startDate, endDate) : 0,
        dailyData: dailyStats.map(s => ({
          date: s.stat_date,
          revenue: parseFloat(s.total_revenue || 0),
          tickets: parseInt(s.total_tickets_sold || 0),
          customers: parseInt(s.unique_customers || 0)
        }))
      };
    }

    // Fallback: Query trực tiếp từ Orders
    return await this.getOverviewReportFromOrders(startDate, endDate);
  },

  async getOrderCount(startDate, endDate) {
    return await Order.count({
      where: {
        status: 'Paid',
        created_at: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] }
      }
    });
  },

  async getOverviewReportFromOrders(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate + 'T23:59:59');

    const stats = await Order.findOne({
      where: {
        status: 'Paid',
        created_at: { [Op.between]: [start, end] }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('user_id'))), 'totalCustomers']
      ],
      raw: true
    });

    const totalTickets = await Ticket.count({
      where: {
        status: 'Paid',
        created_at: { [Op.between]: [start, end] }
      }
    });

    // Daily breakdown
    const dailyData = await Order.findAll({
      where: {
        status: 'Paid',
        created_at: { [Op.between]: [start, end] }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orders'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('user_id'))), 'customers']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    return {
      totalRevenue: parseFloat(stats?.totalRevenue || 0),
      totalOrders: parseInt(stats?.totalOrders || 0),
      totalTickets,
      totalCustomers: parseInt(stats?.totalCustomers || 0),
      dailyData: dailyData.map(d => ({
        date: d.date,
        revenue: parseFloat(d.revenue || 0),
        orders: parseInt(d.orders || 0),
        customers: parseInt(d.customers || 0)
      }))
    };
  },

  /**
   * Báo cáo theo rạp
   */
  async getTheaterReport(startDate, endDate) {
    const stats = await sequelize.query(`
      SELECT 
        th.id as theater_id,
        th.name as theater_name,
        th.address,
        SUM(o.total_amount) as total_revenue,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(t.id) as total_tickets,
        COUNT(DISTINCT o.user_id) as unique_customers
      FROM orders o
      JOIN tickets t ON t.order_id = o.id
      JOIN showtimes s ON s.id = t.showtime_id
      JOIN cinema_rooms cr ON cr.id = s.room_id
      JOIN theaters th ON th.id = cr.theater_id
      WHERE o.status = 'Paid'
        AND o.created_at BETWEEN :startDate AND :endDate
      GROUP BY th.id
      ORDER BY total_revenue DESC
    `, {
      replacements: { 
        startDate: new Date(startDate), 
        endDate: new Date(endDate + 'T23:59:59') 
      },
      type: sequelize.QueryTypes.SELECT
    });

    return stats.map(s => ({
      theaterId: s.theater_id,
      theaterName: s.theater_name,
      address: s.address,
      revenue: parseFloat(s.total_revenue || 0),
      orders: parseInt(s.total_orders || 0),
      tickets: parseInt(s.total_tickets || 0),
      customers: parseInt(s.unique_customers || 0)
    }));
  },

  /**
   * Báo cáo theo phim
   */
  async getMovieReport(startDate, endDate, limit = 10) {
    const stats = await sequelize.query(`
      SELECT 
        m.id as movie_id,
        m.title,
        m.poster_url,
        m.release_date,
        SUM(o.total_amount) as total_revenue,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(t.id) as total_tickets,
        COUNT(DISTINCT o.user_id) as unique_customers
      FROM orders o
      JOIN tickets t ON t.order_id = o.id
      JOIN showtimes s ON s.id = t.showtime_id
      JOIN movies m ON m.id = s.movie_id
      WHERE o.status = 'Paid'
        AND o.created_at BETWEEN :startDate AND :endDate
      GROUP BY m.id
      ORDER BY total_revenue DESC
      LIMIT :limit
    `, {
      replacements: { 
        startDate: new Date(startDate), 
        endDate: new Date(endDate + 'T23:59:59'),
        limit
      },
      type: sequelize.QueryTypes.SELECT
    });

    return stats.map(s => ({
      movieId: s.movie_id,
      title: s.title,
      posterUrl: s.poster_url,
      releaseDate: s.release_date,
      revenue: parseFloat(s.total_revenue || 0),
      orders: parseInt(s.total_orders || 0),
      tickets: parseInt(s.total_tickets || 0),
      customers: parseInt(s.unique_customers || 0)
    }));
  },

  /**
   * So sánh doanh thu theo tháng
   */
  async getMonthlyComparison(year) {
    const stats = await sequelize.query(`
      SELECT 
        MONTH(created_at) as month,
        SUM(total_amount) as revenue,
        COUNT(id) as orders
      FROM orders
      WHERE status = 'Paid'
        AND YEAR(created_at) = :year
      GROUP BY MONTH(created_at)
      ORDER BY month ASC
    `, {
      replacements: { year },
      type: sequelize.QueryTypes.SELECT
    });

    // Fill missing months with 0
    const result = [];
    for (let month = 1; month <= 12; month++) {
      const found = stats.find(s => s.month === month);
      result.push({
        month,
        monthName: new Date(year, month - 1).toLocaleDateString('vi-VN', { month: 'long' }),
        revenue: found ? parseFloat(found.revenue || 0) : 0,
        orders: found ? parseInt(found.orders || 0) : 0
      });
    }

    return result;
  },

  /**
   * Trigger tổng hợp thống kê thủ công
   */
  async triggerAggregation(date) {
    return await aggregateDailyStats(date);
  }
};

export default reportService;
