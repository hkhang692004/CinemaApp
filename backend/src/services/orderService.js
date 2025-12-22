import { Op } from 'sequelize';
import {
  Order,
  Payment,
  Ticket,
  ComboOrder,
  Combo,
  User,
  Showtime,
  Seat,
  CinemaRoom,
  Theater,
  Movie,
  LoyaltyAccount,
  LoyaltyPointsTransaction,
  sequelize
} from '../models/index.js';
import { emitToAdmin, emitToUser, SOCKET_EVENTS } from '../socket.js';

// Lấy danh sách đơn hàng với filters
async function getOrders(filters = {}) {
  const {
    status,
    search,
    startDate,
    endDate,
    theaterId,
    page = 1,
    limit = 20
  } = filters;

  const where = {};
  const includeUser = {
    model: User,
    attributes: ['id', 'full_name', 'email', 'phone']
  };

  // Filter by status
  if (status) {
    where.status = status;
  }

  // Filter by date range
  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) {
      where.created_at[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.created_at[Op.lte] = end;
    }
  }

  // Search by order code, user name, email, phone
  if (search) {
    where[Op.or] = [
      { order_code: { [Op.like]: `%${search}%` } },
      { '$User.full_name$': { [Op.like]: `%${search}%` } },
      { '$User.email$': { [Op.like]: `%${search}%` } },
      { '$User.phone$': { [Op.like]: `%${search}%` } }
    ];
  }

  const offset = (page - 1) * limit;

  // If theaterId filter is provided, we need to get order IDs first for accurate pagination
  let orderIdsInTheater = null;
  if (theaterId) {
    const theaterIdArray = Array.isArray(theaterId) ? theaterId.map(id => parseInt(id)) : [parseInt(theaterId)];
    const ordersInTheater = await Order.findAll({
      attributes: ['id'],
      include: [{
        model: Ticket,
        required: true,
        attributes: [],
        include: [{
          model: Showtime,
          required: true,
          attributes: [],
          include: [{
            model: CinemaRoom,
            required: true,
            attributes: [],
            where: { theater_id: { [Op.in]: theaterIdArray } }
          }]
        }]
      }],
      where,
      raw: true
    });
    orderIdsInTheater = [...new Set(ordersInTheater.map(o => o.id))]; // Remove duplicates
  }

  // Build where clause with order IDs if filtering by theater
  const queryWhere = orderIdsInTheater 
    ? { ...where, id: { [Op.in]: orderIdsInTheater } }
    : where;
    
  const ticketInclude = {
    model: Ticket,
    attributes: ['id', 'status', 'price'],
    include: [
      {
        model: Showtime,
        attributes: ['id', 'start_time', 'end_time'],
        include: [
          {
            model: Movie,
            attributes: ['id', 'title', 'poster_url']
          },
          {
            model: CinemaRoom,
            attributes: ['id', 'name'],
            include: [{
              model: Theater,
              attributes: ['id', 'name']
            }]
          }
        ]
      },
      {
        model: Seat,
        attributes: ['id', 'row_label', 'seat_number', 'seat_type']
      }
    ]
  };

  const { count, rows } = await Order.findAndCountAll({
    where: queryWhere,
    include: [
      includeUser,
      ticketInclude,
      {
        model: Payment,
        attributes: ['id', 'status', 'amount', 'provider', 'paid_at']
      },
      {
        model: ComboOrder,
        attributes: ['id', 'quantity', 'unit_price'],
        include: [{
          model: Combo,
          attributes: ['id', 'name']
        }]
      }
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset,
    distinct: true
  });

  // Calculate total based on theater filter
  const total = orderIdsInTheater ? orderIdsInTheater.length : count;

  return {
    orders: rows,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit)
  };
}

// Lấy chi tiết đơn hàng
async function getOrderById(orderId) {
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: User,
        attributes: ['id', 'full_name', 'email', 'phone', 'avatar_url']
      },
      {
        model: Ticket,
        include: [
          {
            model: Showtime,
            include: [
              { model: Movie, attributes: ['id', 'title', 'poster_url', 'duration_min'] },
              {
                model: CinemaRoom,
                attributes: ['id', 'name'],
                include: [{ model: Theater, attributes: ['id', 'name', 'address'] }]
              }
            ]
          },
          {
            model: Seat,
            attributes: ['id', 'row_label', 'seat_number', 'seat_type']
          }
        ]
      },
      {
        model: Payment,
        attributes: ['id', 'status', 'amount', 'provider', 'provider_payment_id', 'paid_at', 'response_data']
      },
      {
        model: ComboOrder,
        include: [{ model: Combo, attributes: ['id', 'name', 'image_url'] }]
      }
    ]
  });

  if (!order) {
    throw new Error('Không tìm thấy đơn hàng');
  }

  return order;
}

// Lấy thống kê đơn hàng
async function getOrderStats(filters = {}) {
  const { startDate, endDate, theaterId } = filters;

  const where = {};
  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) where.created_at[Op.gte] = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.created_at[Op.lte] = end;
    }
  }

  // For theater filtering, we need to use subquery approach
  let orderIdsInTheater = null;
  if (theaterId) {
    const theaterIds = Array.isArray(theaterId) ? theaterId.map(id => parseInt(id)) : [parseInt(theaterId)];
    const ordersInTheater = await Order.findAll({
      attributes: ['id'],
      include: [{
        model: Ticket,
        required: true,
        attributes: [],
        include: [{
          model: Showtime,
          required: true,
          attributes: [],
          include: [{
            model: CinemaRoom,
            required: true,
            attributes: [],
            where: { theater_id: { [Op.in]: theaterIds } }
          }]
        }]
      }],
      raw: true
    });
    orderIdsInTheater = ordersInTheater.map(o => o.id);
    if (orderIdsInTheater.length === 0) {
      // No orders for this theater
      return {
        byStatus: {},
        today: { orders: 0, revenue: 0 },
        thisMonth: { orders: 0, revenue: 0 }
      };
    }
    where.id = { [Op.in]: orderIdsInTheater };
  }

  // Total counts by status
  const statusCounts = await Order.findAll({
    where,
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('total_amount')), 'total']
    ],
    group: ['status'],
    raw: true
  });

  // Today's orders
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayWhere = {
    created_at: { [Op.between]: [today, todayEnd] }
  };
  if (orderIdsInTheater) {
    todayWhere.id = { [Op.in]: orderIdsInTheater };
  }

  const todayOrders = await Order.count({ where: todayWhere });

  const todayRevenueWhere = {
    created_at: { [Op.between]: [today, todayEnd] },
    status: 'Paid'
  };
  if (orderIdsInTheater) {
    todayRevenueWhere.id = { [Op.in]: orderIdsInTheater };
  }

  const todayRevenue = await Order.sum('total_amount', { where: todayRevenueWhere });

  // This month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

  const monthWhere = {
    created_at: { [Op.between]: [monthStart, monthEnd] },
    status: 'Paid'
  };
  if (orderIdsInTheater) {
    monthWhere.id = { [Op.in]: orderIdsInTheater };
  }

  const monthOrders = await Order.count({ where: monthWhere });
  const monthRevenue = await Order.sum('total_amount', { where: monthWhere });

  return {
    byStatus: statusCounts.reduce((acc, item) => {
      acc[item.status] = { count: parseInt(item.count), total: parseFloat(item.total) || 0 };
      return acc;
    }, {}),
    today: {
      orders: todayOrders,
      revenue: todayRevenue || 0
    },
    thisMonth: {
      orders: monthOrders,
      revenue: monthRevenue || 0
    }
  };
}

// Cập nhật trạng thái đơn hàng (chủ yếu để hủy)
async function updateOrderStatus(orderId, status, reason = null) {
  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findByPk(orderId, {
      include: [Ticket, Payment],
      transaction
    });

    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    // Only allow cancel for Pending orders
    if (status === 'Cancelled' && order.status !== 'Pending') {
      throw new Error('Chỉ có thể hủy đơn hàng đang chờ thanh toán');
    }

    // Update order status
    await order.update({ status }, { transaction });

    // If cancelling, update tickets and release seats
    if (status === 'Cancelled') {
      await Ticket.update(
        { status: 'Cancelled' },
        { where: { order_id: orderId }, transaction }
      );

      // Release seat reservations (done by cron job normally)
    }

    // If refunding
    if (status === 'Refunded') {
      await Ticket.update(
        { status: 'Refunded' },
        { where: { order_id: orderId }, transaction }
      );

      await Payment.update(
        { status: 'Refunded', refunded_at: new Date() },
        { where: { order_id: orderId }, transaction }
      );

      // === LOYALTY REFUND LOGIC ===
      let pointsRestored = 0;
      let pointsDeducted = 0;
      
      const loyaltyAccount = await LoyaltyAccount.findOne({
        where: { user_id: order.user_id },
        transaction
      });

      if (loyaltyAccount) {
        // 1. Hoàn điểm đã sử dụng (nếu có)
        if (order.loyalty_points_used > 0) {
          pointsRestored = order.loyalty_points_used;
        }

        // 2. Trừ điểm đã tích từ đơn hàng này (tìm trong transaction history)
        const pointsTransaction = await LoyaltyPointsTransaction.findOne({
          where: { 
            order_id: orderId,
            points_change: { [Op.gt]: 0 } // Chỉ lấy giao dịch tích điểm (dương)
          },
          transaction
        });

        if (pointsTransaction) {
          pointsDeducted = pointsTransaction.points_change;
        }

        // 3. Cập nhật loyalty account
        const netPointsChange = pointsRestored - pointsDeducted;
        const orderAmount = parseFloat(order.total_amount) || 0;

        await loyaltyAccount.update({
          points: sequelize.literal(`GREATEST(0, points + ${netPointsChange})`), // Không cho điểm âm
          total_spent: sequelize.literal(`GREATEST(0, total_spent - ${orderAmount})`),
          yearly_spent: sequelize.literal(`GREATEST(0, yearly_spent - ${orderAmount})`)
        }, { transaction });

        // 4. Ghi log transaction hoàn điểm
        if (netPointsChange !== 0) {
          await LoyaltyPointsTransaction.create({
            user_id: order.user_id,
            order_id: orderId,
            points_change: netPointsChange,
            reason: `Hoàn tiền đơn hàng #${order.order_code} (hoàn ${pointsRestored} điểm, trừ ${pointsDeducted} điểm đã tích)`
          }, { transaction });
        }
      }

      await transaction.commit();
      
      const refundedOrder = await getOrderById(orderId);
      
      // Emit socket event to admin for realtime update
      emitToAdmin(SOCKET_EVENTS.ORDER_REFUNDED, {
        order: refundedOrder,
        orderCode: order.order_code,
        message: `Đơn hàng #${order.order_code} đã được hoàn tiền`
      });
      
      // Emit socket event to user về thay đổi điểm
      const netPointsChange = pointsRestored - pointsDeducted;
      if (netPointsChange !== 0 || pointsRestored > 0 || pointsDeducted > 0) {
        emitToUser(order.user_id, SOCKET_EVENTS.POINTS_RESTORED, {
          orderId: orderId,
          orderCode: order.order_code,
          pointsRestored: pointsRestored,
          pointsDeducted: pointsDeducted,
          netChange: netPointsChange,
          message: netPointsChange >= 0 
            ? `Bạn được hoàn ${pointsRestored.toLocaleString('vi-VN')} điểm, trừ ${pointsDeducted.toLocaleString('vi-VN')} điểm đã tích`
            : `Bạn bị trừ ${Math.abs(netPointsChange).toLocaleString('vi-VN')} điểm do hoàn tiền đơn hàng #${order.order_code}`
        });
      }
      
      return refundedOrder;
    }

    await transaction.commit();
    
    const updatedOrder = await getOrderById(orderId);
    
    // Emit socket event for cancelled order
    if (status === 'Cancelled') {
      emitToAdmin(SOCKET_EVENTS.ORDER_CANCELLED, {
        order: updatedOrder,
        message: `Đơn hàng #${order.order_code} đã bị hủy`
      });
    }
    
    return updatedOrder;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export default {
  getOrders,
  getOrderById,
  getOrderStats,
  updateOrderStatus
};
