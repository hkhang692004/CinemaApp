import orderService from '../services/orderService.js';
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

// Lấy danh sách đơn hàng
async function getOrders(req, res) {
  try {
    const { status, search, startDate, endDate, theaterId, page, limit } = req.query;
    
    // Get manager's theaters if applicable
    const managerTheaterIds = await getManagerTheaterIds(req.user);
    
    // If manager and specific theaterId requested, verify access
    let filterTheaterId = theaterId;
    if (managerTheaterIds) {
      if (theaterId) {
        // Manager requesting specific theater - check access
        if (!managerTheaterIds.includes(parseInt(theaterId))) {
          return res.status(403).json({ message: 'Bạn không có quyền xem đơn hàng của rạp này' });
        }
      } else {
        // No specific theater - filter by all manager's theaters
        filterTheaterId = managerTheaterIds;
      }
    }
    
    const result = await orderService.getOrders({
      status,
      search,
      startDate,
      endDate,
      theaterId: filterTheaterId,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách đơn hàng' });
  }
}

// Lấy chi tiết đơn hàng
async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    
    // Check manager access if applicable
    const managerTheaterIds = await getManagerTheaterIds(req.user);
    if (managerTheaterIds && order.theaterId && !managerTheaterIds.includes(order.theaterId)) {
      return res.status(403).json({ message: 'Bạn không có quyền xem đơn hàng này' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(404).json({ message: error.message });
  }
}

// Lấy thống kê đơn hàng
async function getOrderStats(req, res) {
  try {
    const { startDate, endDate, theaterId } = req.query;
    
    // Get manager's theaters if applicable
    const managerTheaterIds = await getManagerTheaterIds(req.user);
    let filterTheaterId = theaterId;
    
    if (managerTheaterIds) {
      if (theaterId) {
        if (!managerTheaterIds.includes(parseInt(theaterId))) {
          return res.status(403).json({ message: 'Bạn không có quyền xem thống kê của rạp này' });
        }
      } else {
        filterTheaterId = managerTheaterIds;
      }
    }
    
    const stats = await orderService.getOrderStats({ startDate, endDate, theaterId: filterTheaterId });
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Lỗi lấy thống kê đơn hàng' });
  }
}

// Cập nhật trạng thái đơn hàng
async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    if (!['Cancelled', 'Refunded'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    // Check manager access
    const existingOrder = await orderService.getOrderById(id);
    const managerTheaterIds = await getManagerTheaterIds(req.user);
    if (managerTheaterIds && existingOrder.theaterId && !managerTheaterIds.includes(existingOrder.theaterId)) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật đơn hàng này' });
    }

    const order = await orderService.updateOrderStatus(id, status, reason);
    res.json({ message: `Đã ${status === 'Cancelled' ? 'hủy' : 'hoàn tiền'} đơn hàng`, order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(400).json({ message: error.message });
  }
}

export default {
  getOrders,
  getOrderById,
  getOrderStats,
  updateOrderStatus
};
