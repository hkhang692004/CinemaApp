import { User, Theater, ManagerTheater, Role } from '../models/index.js';

class ManagerTheaterService {
  // Lấy danh sách theater của manager
  async getTheatersByManager(userId) {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Theater,
          as: 'managedTheaters',
          through: { attributes: ['assigned_at'] },
        },
      ],
    });

    if (!user) {
      throw new Error('Không tìm thấy user');
    }

    return user.managedTheaters || [];
  }

  // Lấy danh sách manager của theater
  async getManagersByTheater(theaterId) {
    const theater = await Theater.findByPk(theaterId, {
      include: [
        {
          model: User,
          as: 'managers',
          include: [{ model: Role }],
          through: { attributes: ['assigned_at'] },
        },
      ],
    });

    if (!theater) {
      throw new Error('Không tìm thấy rạp');
    }

    return theater.managers || [];
  }

  // Gán manager cho theater (chỉ admin mới được gọi)
  async assignManagerToTheater(userId, theaterId) {
    // Kiểm tra user tồn tại và là manager
    const user = await User.findByPk(userId, {
      include: [{ model: Role }],
    });

    if (!user) {
      throw new Error('Không tìm thấy user');
    }

    if (user.Role.name !== 'manager') {
      throw new Error('User không phải là manager');
    }

    // Kiểm tra theater tồn tại
    const theater = await Theater.findByPk(theaterId);
    if (!theater) {
      throw new Error('Không tìm thấy rạp');
    }

    // Kiểm tra đã gán chưa
    const existing = await ManagerTheater.findOne({
      where: { user_id: userId, theater_id: theaterId },
    });

    if (existing) {
      throw new Error('Manager đã được gán cho rạp này');
    }

    // Gán manager cho theater
    const assignment = await ManagerTheater.create({
      user_id: userId,
      theater_id: theaterId,
    });

    return assignment;
  }

  // Hủy gán manager khỏi theater
  async removeManagerFromTheater(userId, theaterId) {
    const result = await ManagerTheater.destroy({
      where: { user_id: userId, theater_id: theaterId },
    });

    if (result === 0) {
      throw new Error('Không tìm thấy assignment');
    }

    return { message: 'Đã hủy gán manager khỏi rạp' };
  }

  // Kiểm tra manager có quyền truy cập theater không
  async checkManagerAccess(userId, theaterId) {
    const assignment = await ManagerTheater.findOne({
      where: { user_id: userId, theater_id: theaterId },
    });

    return !!assignment;
  }

  // Lấy tất cả manager và theater assignments
  async getAllAssignments() {
    const assignments = await ManagerTheater.findAll({
      include: [
        {
          model: User,
          include: [{ model: Role }],
        },
        {
          model: Theater,
        },
      ],
    });

    return assignments;
  }

  // Lấy danh sách tất cả managers
  async getAllManagers() {
    const managerRole = await Role.findOne({ where: { name: 'manager' } });
    
    if (!managerRole) {
      return [];
    }

    const managers = await User.findAll({
      where: { role_id: managerRole.id },
      include: [
        { model: Role },
        {
          model: Theater,
          as: 'managedTheaters',
          through: { attributes: ['assigned_at'] },
        },
      ],
      attributes: { exclude: ['password_hash', 'otp_code', 'otp_expires'] },
    });

    return managers;
  }
}

export default new ManagerTheaterService();
