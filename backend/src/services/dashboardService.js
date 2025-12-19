import { Order, User, Ticket, Movie, Showtime, Theater, CinemaRoom, DailyStatistic } from '../models/index.js';
import { Op, fn, col, literal } from 'sequelize';

class DashboardService {
  // Lấy thống kê tổng quan
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Doanh thu hôm nay
    const todayRevenueResult = await Order.findOne({
      where: {
        status: 'Paid',
        created_at: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
      attributes: [[fn('SUM', col('total_amount')), 'total']],
      raw: true,
    });
    const todayRevenue = parseFloat(todayRevenueResult?.total || 0);

    // Số đơn hàng hôm nay
    const todayOrders = await Order.count({
      where: {
        created_at: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    // Số vé bán hôm nay
    const todayTickets = await Ticket.count({
      include: [{
        model: Order,
        where: {
          status: 'Paid',
          created_at: {
            [Op.gte]: today,
            [Op.lt]: tomorrow,
          },
        },
      }],
    });

    // Số phim đang chiếu
    const totalMoviesShowing = await Movie.count({
      where: { status: 'now_showing' },
    });

    // Tổng số khách hàng
    const totalCustomers = await User.count({
      where: { role_id: 1 }, // role user
    });

    // Doanh thu hôm qua để tính % thay đổi
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayRevenueResult = await Order.findOne({
      where: {
        status: 'Paid',
        created_at: {
          [Op.gte]: yesterday,
          [Op.lt]: today,
        },
      },
      attributes: [[fn('SUM', col('total_amount')), 'total']],
      raw: true,
    });
    const yesterdayRevenue = parseFloat(yesterdayRevenueResult?.total || 0);

    // Tính % thay đổi
    let revenueChange = 0;
    if (yesterdayRevenue > 0) {
      revenueChange = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1);
    }

    return {
      todayRevenue,
      todayOrders,
      todayTickets,
      totalMoviesShowing,
      totalCustomers,
      revenueChange: parseFloat(revenueChange),
    };
  }

  // Lấy đơn hàng gần đây
  async getRecentOrders(limit = 10) {
    const orders = await Order.findAll({
      include: [{
        model: User,
        attributes: ['id', 'full_name', 'email'],
      }],
      order: [['created_at', 'DESC']],
      limit,
    });

    return orders.map(order => ({
      id: order.id,
      code: order.order_code,
      customer: order.User?.full_name || 'Khách vãng lai',
      email: order.User?.email,
      amount: parseFloat(order.total_amount),
      status: order.status,
      paymentMethod: order.payment_method,
      createdAt: order.created_at,
    }));
  }

  // Lấy doanh thu theo ngày (7 ngày gần nhất)
  async getRevenueChart(days = 7) {
    const results = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const revenue = await Order.findOne({
        where: {
          status: 'Paid',
          created_at: {
            [Op.gte]: date,
            [Op.lt]: nextDate,
          },
        },
        attributes: [[fn('SUM', col('total_amount')), 'total']],
        raw: true,
      });

      results.push({
        date: date.toISOString().split('T')[0],
        revenue: parseFloat(revenue?.total || 0),
      });
    }

    return results;
  }

  // Lấy phim bán chạy nhất
  async getTopMovies(limit = 5) {
    const movies = await Movie.findAll({
      attributes: [
        'id',
        'title',
        'poster_url',
        [literal(`(
          SELECT COUNT(*) FROM tickets t
          JOIN showtimes s ON t.showtime_id = s.id
          JOIN orders o ON t.order_id = o.id
          WHERE s.movie_id = Movie.id AND o.status = 'Paid'
        )`), 'ticketsSold'],
        [literal(`(
          SELECT COALESCE(SUM(t.price), 0) FROM tickets t
          JOIN showtimes s ON t.showtime_id = s.id
          JOIN orders o ON t.order_id = o.id
          WHERE s.movie_id = Movie.id AND o.status = 'Paid'
        )`), 'revenue'],
      ],
      where: { status: 'now_showing' },
      order: [[literal('ticketsSold'), 'DESC']],
      limit,
      raw: true,
    });

    return movies;
  }
}

export default new DashboardService();
