import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { User } from '../models/User.js';
import Role from '../models/Role.js';
import ManagerTheater from '../models/ManagerTheater.js';
import Theater from '../models/Theater.js';

export const managerService = {
  /**
   * Lấy danh sách tất cả managers
   */
  async getAllManagers() {
    const managerRole = await Role.findOne({ where: { name: 'manager' } });
    if (!managerRole) return [];

    const managers = await User.findAll({
      where: { role_id: managerRole.id },
      attributes: ['id', 'email', 'full_name', 'phone', 'avatar_url', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    // Lấy thông tin theaters được gán cho mỗi manager
    const result = await Promise.all(managers.map(async (manager) => {
      const managerTheaters = await ManagerTheater.findAll({
        where: { user_id: manager.id },
        include: [{
          model: Theater,
          as: 'Theater',
          attributes: ['id', 'name', 'address']
        }]
      });

      return {
        id: manager.id,
        email: manager.email,
        fullName: manager.full_name,
        phone: manager.phone,
        avatarUrl: manager.avatar_url,
        createdAt: manager.created_at,
        theaters: managerTheaters.map(mt => mt.Theater)
      };
    }));

    return result;
  },

  /**
   * Tạo tài khoản manager mới
   */
  async createManager(data) {
    const { email, password, full_name, phone, theater_ids } = data;

    // Validation
    if (!email || !password || !full_name || !phone) {
      throw new Error('Vui lòng điền đầy đủ thông tin');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email không hợp lệ');
    }

    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('Số điện thoại không hợp lệ');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new Error('Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&)');
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('Email đã được sử dụng');
    }

    // Lấy role manager
    const managerRole = await Role.findOne({ where: { name: 'manager' } });
    if (!managerRole) {
      throw new Error('Không tìm thấy role manager');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user
    const newManager = await User.create({
      role_id: managerRole.id,
      email,
      password_hash: hashedPassword,
      full_name,
      phone,
      avatar_url: null,
      date_of_birth: null
    });

    // Gán theaters nếu có
    if (theater_ids && theater_ids.length > 0) {
      await Promise.all(theater_ids.map(theaterId => 
        ManagerTheater.create({
          user_id: newManager.id,
          theater_id: theaterId
        })
      ));
    }

    return {
      id: newManager.id,
      email: newManager.email,
      fullName: newManager.full_name,
      phone: newManager.phone
    };
  },

  /**
   * Cập nhật thông tin manager
   */
  async updateManager(managerId, data) {
    const { full_name, phone, password, theater_ids } = data;

    const manager = await User.findByPk(managerId);
    if (!manager) {
      throw new Error('Không tìm thấy manager');
    }

    // Kiểm tra có phải manager không
    const managerRole = await Role.findOne({ where: { name: 'manager' } });
    if (manager.role_id !== managerRole.id) {
      throw new Error('User này không phải là manager');
    }

    // Cập nhật thông tin
    if (full_name) manager.full_name = full_name;
    if (phone) {
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(phone)) {
        throw new Error('Số điện thoại không hợp lệ');
      }
      manager.phone = phone;
    }
    if (password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
      if (!passwordRegex.test(password)) {
        throw new Error('Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&)');
      }
      manager.password_hash = await bcrypt.hash(password, 10);
    }

    await manager.save();

    // Cập nhật theaters nếu có
    if (theater_ids !== undefined) {
      // Xóa tất cả gán cũ
      await ManagerTheater.destroy({ where: { user_id: managerId } });
      
      // Gán mới
      if (theater_ids.length > 0) {
        await Promise.all(theater_ids.map(theaterId => 
          ManagerTheater.create({
            user_id: managerId,
            theater_id: theaterId
          })
        ));
      }
    }

    return {
      id: manager.id,
      email: manager.email,
      fullName: manager.full_name,
      phone: manager.phone
    };
  },

  /**
   * Xóa manager
   */
  async deleteManager(managerId) {
    const manager = await User.findByPk(managerId);
    if (!manager) {
      throw new Error('Không tìm thấy manager');
    }

    // Kiểm tra có phải manager không
    const managerRole = await Role.findOne({ where: { name: 'manager' } });
    if (manager.role_id !== managerRole.id) {
      throw new Error('User này không phải là manager');
    }

    // Xóa các gán theater
    await ManagerTheater.destroy({ where: { user_id: managerId } });

    // Xóa user
    await manager.destroy();

    return true;
  },

  /**
   * Lấy danh sách theaters để assign
   */
  async getAvailableTheaters() {
    const theaters = await Theater.findAll({
      attributes: ['id', 'name', 'address'],
      order: [['name', 'ASC']]
    });
    return theaters;
  }
};

export default managerService;
