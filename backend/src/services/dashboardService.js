import { Order, User, Ticket, Movie, Showtime, Theater, CinemaRoom, DailyStatistic, GroupBooking } from '../models/index.js';
import { Op, fn, col, literal } from 'sequelize';

class DashboardService {
  // Lấy thống kê tổng quan (theaterIds: array of theater IDs for manager, null for admin)
  async getStats(theaterIds = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Build theater filter for orders (via tickets -> showtimes -> cinema_rooms)
    let orderFilter = {
      status: 'Paid',
      created_at: {
        [Op.gte]: today,
        [Op.lt]: tomorrow,
      },
    };

    let groupBookingFilter = {
      status: 'Completed',
      updated_at: {
        [Op.gte]: today,
        [Op.lt]: tomorrow,
      },
    };

    // Doanh thu hôm nay (từ orders)
    let todayOrderRevenue = 0;
    if (theaterIds && theaterIds.length > 0) {
      // Manager: filter orders by theater through tickets
      const rooms = await CinemaRoom.findAll({
        where: { theater_id: theaterIds },
        attributes: ['id']
      });
      const roomIds = rooms.map(r => r.id);
      
      const showtimes = await Showtime.findAll({
        where: { room_id: roomIds },
        attributes: ['id']
      });
      const showtimeIds = showtimes.map(s => s.id);
      
      if (showtimeIds.length > 0) {
        const tickets = await Ticket.findAll({
          where: { showtime_id: showtimeIds },
          include: [{
            model: Order,
            where: { status: 'Paid', created_at: { [Op.gte]: today, [Op.lt]: tomorrow } },
            attributes: ['id', 'total_amount']
          }],
          attributes: ['order_id']
        });
        
        // Get unique orders and sum
        const orderMap = new Map();
        tickets.forEach(t => {
          if (t.Order && !orderMap.has(t.Order.id)) {
            orderMap.set(t.Order.id, parseFloat(t.Order.total_amount));
          }
        });
        todayOrderRevenue = Array.from(orderMap.values()).reduce((a, b) => a + b, 0);
      }

      // Group booking filter by theater
      groupBookingFilter.theater_id = theaterIds;
    } else {
      // Admin: all orders
      const todayRevenueResult = await Order.findOne({
        where: orderFilter,
        attributes: [[fn('SUM', col('total_amount')), 'total']],
        raw: true,
      });
      todayOrderRevenue = parseFloat(todayRevenueResult?.total || 0);
    }

    // Doanh thu từ Group Booking hôm nay (status = Completed)
    const todayGroupRevenueResult = await GroupBooking.findOne({
      where: groupBookingFilter,
      attributes: [[fn('SUM', col('final_price')), 'total']],
      raw: true,
    });
    const todayGroupRevenue = parseFloat(todayGroupRevenueResult?.total || 0);
    const todayRevenue = todayOrderRevenue + todayGroupRevenue;

    // Số đơn hàng hôm nay
    let todayOrders = 0;
    if (theaterIds && theaterIds.length > 0) {
      const rooms = await CinemaRoom.findAll({
        where: { theater_id: theaterIds },
        attributes: ['id']
      });
      const roomIds = rooms.map(r => r.id);
      const showtimes = await Showtime.findAll({
        where: { room_id: roomIds },
        attributes: ['id']
      });
      const showtimeIds = showtimes.map(s => s.id);
      
      if (showtimeIds.length > 0) {
        const tickets = await Ticket.findAll({
          where: { showtime_id: showtimeIds },
          include: [{
            model: Order,
            where: { created_at: { [Op.gte]: today, [Op.lt]: tomorrow } },
            attributes: ['id']
          }],
          attributes: ['order_id']
        });
        const uniqueOrders = new Set(tickets.filter(t => t.Order).map(t => t.Order.id));
        todayOrders = uniqueOrders.size;
      }
    } else {
      todayOrders = await Order.count({
        where: {
          created_at: {
            [Op.gte]: today,
            [Op.lt]: tomorrow,
          },
        },
      });
    }

    // Số Group Booking hoàn thành hôm nay
    const todayGroupBookings = await GroupBooking.count({
      where: groupBookingFilter,
    });

    // Số vé bán hôm nay
    let todayTickets = 0;
    if (theaterIds && theaterIds.length > 0) {
      const rooms = await CinemaRoom.findAll({
        where: { theater_id: theaterIds },
        attributes: ['id']
      });
      const roomIds = rooms.map(r => r.id);
      const showtimes = await Showtime.findAll({
        where: { room_id: roomIds },
        attributes: ['id']
      });
      const showtimeIds = showtimes.map(s => s.id);
      
      if (showtimeIds.length > 0) {
        todayTickets = await Ticket.count({
          where: { showtime_id: showtimeIds },
          include: [{
            model: Order,
            where: {
              status: 'Paid',
              created_at: { [Op.gte]: today, [Op.lt]: tomorrow },
            },
          }],
        });
      }
    } else {
      todayTickets = await Ticket.count({
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
    }

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
    
    let yesterdayOrderRevenue = 0;
    if (theaterIds && theaterIds.length > 0) {
      const rooms = await CinemaRoom.findAll({
        where: { theater_id: theaterIds },
        attributes: ['id']
      });
      const roomIds = rooms.map(r => r.id);
      const showtimes = await Showtime.findAll({
        where: { room_id: roomIds },
        attributes: ['id']
      });
      const showtimeIds = showtimes.map(s => s.id);
      
      if (showtimeIds.length > 0) {
        const tickets = await Ticket.findAll({
          where: { showtime_id: showtimeIds },
          include: [{
            model: Order,
            where: { status: 'Paid', created_at: { [Op.gte]: yesterday, [Op.lt]: today } },
            attributes: ['id', 'total_amount']
          }],
          attributes: ['order_id']
        });
        const orderMap = new Map();
        tickets.forEach(t => {
          if (t.Order && !orderMap.has(t.Order.id)) {
            orderMap.set(t.Order.id, parseFloat(t.Order.total_amount));
          }
        });
        yesterdayOrderRevenue = Array.from(orderMap.values()).reduce((a, b) => a + b, 0);
      }
    } else {
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
      yesterdayOrderRevenue = parseFloat(yesterdayRevenueResult?.total || 0);
    }
    
    const yesterdayGroupFilter = {
      status: 'Completed',
      updated_at: {
        [Op.gte]: yesterday,
        [Op.lt]: today,
      },
    };
    if (theaterIds && theaterIds.length > 0) {
      yesterdayGroupFilter.theater_id = theaterIds;
    }
    
    const yesterdayGroupResult = await GroupBooking.findOne({
      where: yesterdayGroupFilter,
      attributes: [[fn('SUM', col('final_price')), 'total']],
      raw: true,
    });
    const yesterdayGroupRevenue = parseFloat(yesterdayGroupResult?.total || 0);
    const yesterdayRevenue = yesterdayOrderRevenue + yesterdayGroupRevenue;

    // Tính % thay đổi
    let revenueChange = 0;
    if (yesterdayRevenue > 0) {
      revenueChange = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1);
    }

    return {
      todayRevenue,
      todayOrderRevenue,
      todayGroupRevenue,
      todayOrders,
      todayGroupBookings,
      todayTickets,
      totalMoviesShowing,
      totalCustomers,
      revenueChange: parseFloat(revenueChange),
    };
  }

  // Lấy đơn hàng gần đây (theaterIds: array of theater IDs for manager, null for admin)
  async getRecentOrders(limit = 10, theaterIds = null) {
    let orderIds = null;
    
    if (theaterIds && theaterIds.length > 0) {
      // Manager: filter orders by theater through tickets
      const rooms = await CinemaRoom.findAll({
        where: { theater_id: theaterIds },
        attributes: ['id']
      });
      const roomIds = rooms.map(r => r.id);
      
      const showtimes = await Showtime.findAll({
        where: { room_id: roomIds },
        attributes: ['id']
      });
      const showtimeIds = showtimes.map(s => s.id);
      
      if (showtimeIds.length === 0) {
        return [];
      }
      
      const tickets = await Ticket.findAll({
        where: { showtime_id: showtimeIds },
        attributes: ['order_id'],
        group: ['order_id']
      });
      orderIds = tickets.map(t => t.order_id);
      
      if (orderIds.length === 0) {
        return [];
      }
    }

    const whereClause = orderIds ? { id: orderIds } : {};
    
    const orders = await Order.findAll({
      where: whereClause,
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

  // Lấy doanh thu theo ngày (7 ngày gần nhất) - theaterIds for filtering
  async getRevenueChart(days = 7, theaterIds = null) {
    const results = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pre-fetch room and showtime IDs for manager
    let showtimeIds = null;
    if (theaterIds && theaterIds.length > 0) {
      const rooms = await CinemaRoom.findAll({
        where: { theater_id: theaterIds },
        attributes: ['id']
      });
      const roomIds = rooms.map(r => r.id);
      
      const showtimes = await Showtime.findAll({
        where: { room_id: roomIds },
        attributes: ['id']
      });
      showtimeIds = showtimes.map(s => s.id);
    }

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      let orderRevenueValue = 0;
      
      if (theaterIds && theaterIds.length > 0 && showtimeIds) {
        if (showtimeIds.length > 0) {
          const tickets = await Ticket.findAll({
            where: { showtime_id: showtimeIds },
            include: [{
              model: Order,
              where: {
                status: 'Paid',
                created_at: { [Op.gte]: date, [Op.lt]: nextDate },
              },
              attributes: ['id', 'total_amount']
            }],
            attributes: ['order_id']
          });
          
          const orderMap = new Map();
          tickets.forEach(t => {
            if (t.Order && !orderMap.has(t.Order.id)) {
              orderMap.set(t.Order.id, parseFloat(t.Order.total_amount));
            }
          });
          orderRevenueValue = Array.from(orderMap.values()).reduce((a, b) => a + b, 0);
        }
      } else {
        // Admin: all orders
        const orderRevenue = await Order.findOne({
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
        orderRevenueValue = parseFloat(orderRevenue?.total || 0);
      }

      // Doanh thu từ group booking
      const groupBookingFilter = {
        status: 'Completed',
        updated_at: {
          [Op.gte]: date,
          [Op.lt]: nextDate,
        },
      };
      if (theaterIds && theaterIds.length > 0) {
        groupBookingFilter.theater_id = theaterIds;
      }
      
      const groupRevenue = await GroupBooking.findOne({
        where: groupBookingFilter,
        attributes: [[fn('SUM', col('final_price')), 'total']],
        raw: true,
      });

      results.push({
        date: date.toISOString().split('T')[0],
        revenue: orderRevenueValue + parseFloat(groupRevenue?.total || 0),
        orderRevenue: orderRevenueValue,
        groupRevenue: parseFloat(groupRevenue?.total || 0),
      });
    }

    return results;
  }

  // Lấy phim bán chạy nhất (theaterIds for filtering)
  async getTopMovies(limit = 5, theaterIds = null) {
    let theaterFilter = '';
    if (theaterIds && theaterIds.length > 0) {
      theaterFilter = `AND cr.theater_id IN (${theaterIds.join(',')})`;
    }
    
    const movies = await Movie.findAll({
      attributes: [
        'id',
        'title',
        'poster_url',
        [literal(`(
          SELECT COUNT(*) FROM tickets t
          JOIN showtimes s ON t.showtime_id = s.id
          JOIN cinema_rooms cr ON s.room_id = cr.id
          JOIN orders o ON t.order_id = o.id
          WHERE s.movie_id = Movie.id AND o.status = 'Paid' ${theaterFilter}
        )`), 'ticketsSold'],
        [literal(`(
          SELECT COALESCE(SUM(t.price), 0) FROM tickets t
          JOIN showtimes s ON t.showtime_id = s.id
          JOIN cinema_rooms cr ON s.room_id = cr.id
          JOIN orders o ON t.order_id = o.id
          WHERE s.movie_id = Movie.id AND o.status = 'Paid' ${theaterFilter}
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
