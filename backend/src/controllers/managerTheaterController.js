import managerTheaterService from '../services/managerTheaterService.js';

class ManagerTheaterController {
  // GET /api/manager-theaters/my-theaters - Manager lấy danh sách rạp của mình
  async getMyTheaters(req, res) {
    try {
      const theaters = await managerTheaterService.getTheatersByManager(req.user.id);
      res.json({ theaters });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // GET /api/manager-theaters/managers - Admin lấy danh sách tất cả managers
  async getAllManagers(req, res) {
    try {
      const managers = await managerTheaterService.getAllManagers();
      res.json({ managers });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // GET /api/manager-theaters/theater/:theaterId/managers - Lấy managers của theater
  async getManagersByTheater(req, res) {
    try {
      const { theaterId } = req.params;
      const managers = await managerTheaterService.getManagersByTheater(theaterId);
      res.json({ managers });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // POST /api/manager-theaters/assign - Admin gán manager cho theater
  async assignManager(req, res) {
    try {
      const { userId, theaterId } = req.body;

      if (!userId || !theaterId) {
        return res.status(400).json({ message: 'userId và theaterId là bắt buộc' });
      }

      const assignment = await managerTheaterService.assignManagerToTheater(userId, theaterId);
      res.status(201).json({ 
        message: 'Gán manager thành công', 
        assignment 
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // DELETE /api/manager-theaters/remove - Admin hủy gán manager
  async removeManager(req, res) {
    try {
      const { userId, theaterId } = req.body;

      if (!userId || !theaterId) {
        return res.status(400).json({ message: 'userId và theaterId là bắt buộc' });
      }

      await managerTheaterService.removeManagerFromTheater(userId, theaterId);
      res.json({ message: 'Hủy gán manager thành công' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // GET /api/manager-theaters/check/:theaterId - Kiểm tra manager có quyền truy cập theater
  async checkAccess(req, res) {
    try {
      const { theaterId } = req.params;
      const hasAccess = await managerTheaterService.checkManagerAccess(req.user.id, theaterId);
      res.json({ hasAccess });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // GET /api/manager-theaters/assignments - Admin lấy tất cả assignments
  async getAllAssignments(req, res) {
    try {
      const assignments = await managerTheaterService.getAllAssignments();
      res.json({ assignments });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

export default new ManagerTheaterController();
