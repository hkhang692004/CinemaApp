import { Op } from 'sequelize';
import { 
  DailyStatistic, 
  Order, 
  Ticket, 
  Movie, 
  Theater, 
  User,
  Showtime,
  GroupBooking,
  sequelize 
} from '../models/index.js';
import { aggregateDailyStats } from '../jobs/updateShowtimeStatus.js';

export const reportService = {
  /**
   * Lấy báo cáo tổng quan theo khoảng thời gian
   */
  async getOverviewReport(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate + 'T23:59:59');
    
    // Get order statistics
    const orderStats = await Order.findOne({
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

    // Get group booking statistics
    const groupStats = await GroupBooking.findOne({
      where: {
        status: 'Completed',
        updated_at: { [Op.between]: [start, end] }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('final_price')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalBookings'],
        [sequelize.fn('SUM', sequelize.col('guest_count')), 'totalGuests']
      ],
      raw: true
    });

    const totalTickets = await Ticket.count({
      where: {
        status: 'Paid',
        created_at: { [Op.between]: [start, end] }
      }
    });

    // Daily breakdown for orders
    const dailyOrderData = await Order.findAll({
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

    // Daily breakdown for group bookings
    const dailyGroupData = await GroupBooking.findAll({
      where: {
        status: 'Completed',
        updated_at: { [Op.between]: [start, end] }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('updated_at')), 'date'],
        [sequelize.fn('SUM', sequelize.col('final_price')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'bookings'],
        [sequelize.fn('SUM', sequelize.col('guest_count')), 'guests']
      ],
      group: [sequelize.fn('DATE', sequelize.col('updated_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('updated_at')), 'ASC']],
      raw: true
    });

    // Merge daily data
    const dailyMap = new Map();
    dailyOrderData.forEach(d => {
      dailyMap.set(d.date, {
        date: d.date,
        orderRevenue: parseFloat(d.revenue || 0),
        groupRevenue: 0,
        revenue: parseFloat(d.revenue || 0),
        orders: parseInt(d.orders || 0),
        customers: parseInt(d.customers || 0),
        groupBookings: 0,
        groupGuests: 0
      });
    });
    
    dailyGroupData.forEach(d => {
      if (dailyMap.has(d.date)) {
        const existing = dailyMap.get(d.date);
        existing.groupRevenue = parseFloat(d.revenue || 0);
        existing.revenue += parseFloat(d.revenue || 0);
        existing.groupBookings = parseInt(d.bookings || 0);
        existing.groupGuests = parseInt(d.guests || 0);
      } else {
        dailyMap.set(d.date, {
          date: d.date,
          orderRevenue: 0,
          groupRevenue: parseFloat(d.revenue || 0),
          revenue: parseFloat(d.revenue || 0),
          orders: 0,
          customers: 0,
          groupBookings: parseInt(d.bookings || 0),
          groupGuests: parseInt(d.guests || 0)
        });
      }
    });

    const dailyData = Array.from(dailyMap.values()).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    return {
      totalRevenue: parseFloat(orderStats?.totalRevenue || 0) + parseFloat(groupStats?.totalRevenue || 0),
      totalOrderRevenue: parseFloat(orderStats?.totalRevenue || 0),
      totalGroupRevenue: parseFloat(groupStats?.totalRevenue || 0),
      totalOrders: parseInt(orderStats?.totalOrders || 0),
      totalGroupBookings: parseInt(groupStats?.totalBookings || 0),
      totalTickets,
      totalCustomers: parseInt(orderStats?.totalCustomers || 0),
      totalGroupGuests: parseInt(groupStats?.totalGuests || 0),
      dailyData
    };
  },

  async getOrderCount(startDate, endDate) {
    return await Order.count({
      where: {
        status: 'Paid',
        created_at: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] }
      }
    });
  },

  /**
   * Báo cáo theo rạp
   */
  async getTheaterReport(startDate, endDate) {
    // Order revenue by theater
    const orderStats = await sequelize.query(`
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
    `, {
      replacements: { 
        startDate: new Date(startDate), 
        endDate: new Date(endDate + 'T23:59:59') 
      },
      type: sequelize.QueryTypes.SELECT
    });

    // Group booking revenue by theater (join through theater_id directly)
    const groupStats = await sequelize.query(`
      SELECT 
        th.id as theater_id,
        th.name as theater_name,
        th.address,
        SUM(gb.final_price) as total_revenue,
        COUNT(gb.id) as total_bookings,
        SUM(gb.guest_count) as total_guests
      FROM group_bookings gb
      JOIN theaters th ON th.id = gb.theater_id
      WHERE gb.status = 'Completed'
        AND gb.theater_id IS NOT NULL
        AND gb.updated_at BETWEEN :startDate AND :endDate
      GROUP BY th.id
    `, {
      replacements: { 
        startDate: new Date(startDate), 
        endDate: new Date(endDate + 'T23:59:59') 
      },
      type: sequelize.QueryTypes.SELECT
    });

    // Merge data
    const theaterMap = new Map();
    
    orderStats.forEach(s => {
      theaterMap.set(s.theater_id, {
        theaterId: s.theater_id,
        theaterName: s.theater_name,
        address: s.address,
        orderRevenue: parseFloat(s.total_revenue || 0),
        groupRevenue: 0,
        revenue: parseFloat(s.total_revenue || 0),
        orders: parseInt(s.total_orders || 0),
        tickets: parseInt(s.total_tickets || 0),
        customers: parseInt(s.unique_customers || 0),
        groupBookings: 0,
        groupGuests: 0
      });
    });

    groupStats.forEach(s => {
      if (theaterMap.has(s.theater_id)) {
        const existing = theaterMap.get(s.theater_id);
        existing.groupRevenue = parseFloat(s.total_revenue || 0);
        existing.revenue += parseFloat(s.total_revenue || 0);
        existing.groupBookings = parseInt(s.total_bookings || 0);
        existing.groupGuests = parseInt(s.total_guests || 0);
      } else {
        theaterMap.set(s.theater_id, {
          theaterId: s.theater_id,
          theaterName: s.theater_name,
          address: s.address,
          orderRevenue: 0,
          groupRevenue: parseFloat(s.total_revenue || 0),
          revenue: parseFloat(s.total_revenue || 0),
          orders: 0,
          tickets: 0,
          customers: 0,
          groupBookings: parseInt(s.total_bookings || 0),
          groupGuests: parseInt(s.total_guests || 0)
        });
      }
    });

    return Array.from(theaterMap.values()).sort((a, b) => b.revenue - a.revenue);
  },

  /**
   * Báo cáo theo phim
   */
  async getMovieReport(startDate, endDate, limit = 10) {
    // Order revenue by movie
    const orderStats = await sequelize.query(`
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
    `, {
      replacements: { 
        startDate: new Date(startDate), 
        endDate: new Date(endDate + 'T23:59:59')
      },
      type: sequelize.QueryTypes.SELECT
    });

    // Group booking revenue by movie (join through assigned_showtime_id)
    const groupStats = await sequelize.query(`
      SELECT 
        m.id as movie_id,
        m.title,
        m.poster_url,
        m.release_date,
        SUM(gb.final_price) as total_revenue,
        COUNT(gb.id) as total_bookings,
        SUM(gb.guest_count) as total_guests
      FROM group_bookings gb
      JOIN showtimes s ON s.id = gb.assigned_showtime_id
      JOIN movies m ON m.id = s.movie_id
      WHERE gb.status = 'Completed'
        AND gb.assigned_showtime_id IS NOT NULL
        AND gb.updated_at BETWEEN :startDate AND :endDate
      GROUP BY m.id
    `, {
      replacements: { 
        startDate: new Date(startDate), 
        endDate: new Date(endDate + 'T23:59:59')
      },
      type: sequelize.QueryTypes.SELECT
    });

    // Merge data
    const movieMap = new Map();
    
    orderStats.forEach(s => {
      movieMap.set(s.movie_id, {
        movieId: s.movie_id,
        title: s.title,
        posterUrl: s.poster_url,
        releaseDate: s.release_date,
        orderRevenue: parseFloat(s.total_revenue || 0),
        groupRevenue: 0,
        revenue: parseFloat(s.total_revenue || 0),
        orders: parseInt(s.total_orders || 0),
        tickets: parseInt(s.total_tickets || 0),
        customers: parseInt(s.unique_customers || 0),
        groupBookings: 0,
        groupGuests: 0
      });
    });

    groupStats.forEach(s => {
      if (movieMap.has(s.movie_id)) {
        const existing = movieMap.get(s.movie_id);
        existing.groupRevenue = parseFloat(s.total_revenue || 0);
        existing.revenue += parseFloat(s.total_revenue || 0);
        existing.groupBookings = parseInt(s.total_bookings || 0);
        existing.groupGuests = parseInt(s.total_guests || 0);
      } else {
        movieMap.set(s.movie_id, {
          movieId: s.movie_id,
          title: s.title,
          posterUrl: s.poster_url,
          releaseDate: s.release_date,
          orderRevenue: 0,
          groupRevenue: parseFloat(s.total_revenue || 0),
          revenue: parseFloat(s.total_revenue || 0),
          orders: 0,
          tickets: 0,
          customers: 0,
          groupBookings: parseInt(s.total_bookings || 0),
          groupGuests: parseInt(s.total_guests || 0)
        });
      }
    });

    return Array.from(movieMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  },

  /**
   * So sánh doanh thu theo tháng
   */
  async getMonthlyComparison(year) {
    // Order revenue by month
    const orderStats = await sequelize.query(`
      SELECT 
        MONTH(created_at) as month,
        SUM(total_amount) as revenue,
        COUNT(id) as orders
      FROM orders
      WHERE status = 'Paid'
        AND YEAR(created_at) = :year
      GROUP BY MONTH(created_at)
    `, {
      replacements: { year },
      type: sequelize.QueryTypes.SELECT
    });

    // Group booking revenue by month
    const groupStats = await sequelize.query(`
      SELECT 
        MONTH(updated_at) as month,
        SUM(final_price) as revenue,
        COUNT(id) as bookings,
        SUM(guest_count) as guests
      FROM group_bookings
      WHERE status = 'Completed'
        AND YEAR(updated_at) = :year
      GROUP BY MONTH(updated_at)
    `, {
      replacements: { year },
      type: sequelize.QueryTypes.SELECT
    });

    // Fill all months and merge data
    const result = [];
    for (let month = 1; month <= 12; month++) {
      const orderFound = orderStats.find(s => s.month === month);
      const groupFound = groupStats.find(s => s.month === month);
      
      const orderRevenue = orderFound ? parseFloat(orderFound.revenue || 0) : 0;
      const groupRevenue = groupFound ? parseFloat(groupFound.revenue || 0) : 0;
      
      result.push({
        month,
        monthName: new Date(year, month - 1).toLocaleDateString('vi-VN', { month: 'long' }),
        orderRevenue,
        groupRevenue,
        revenue: orderRevenue + groupRevenue,
        orders: orderFound ? parseInt(orderFound.orders || 0) : 0,
        groupBookings: groupFound ? parseInt(groupFound.bookings || 0) : 0,
        groupGuests: groupFound ? parseInt(groupFound.guests || 0) : 0
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
