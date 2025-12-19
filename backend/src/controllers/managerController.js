import managerService from '../services/managerService.js';

/**
 * Lấy danh sách tất cả managers
 */
export const getAllManagers = async (req, res) => {
  try {
    const managers = await managerService.getAllManagers();
    res.status(200).json({
      success: true,
      data: managers
    });
  } catch (error) {
    console.error('Error getting managers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi server'
    });
  }
};

/**
 * Tạo manager mới
 */
export const createManager = async (req, res) => {
  try {
    const manager = await managerService.createManager(req.body);
    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản manager thành công',
      data: manager
    });
  } catch (error) {
    console.error('Error creating manager:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Lỗi tạo manager'
    });
  }
};

/**
 * Cập nhật manager
 */
export const updateManager = async (req, res) => {
  try {
    const { id } = req.params;
    const manager = await managerService.updateManager(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Cập nhật manager thành công',
      data: manager
    });
  } catch (error) {
    console.error('Error updating manager:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Lỗi cập nhật manager'
    });
  }
};

/**
 * Xóa manager
 */
export const deleteManager = async (req, res) => {
  try {
    const { id } = req.params;
    await managerService.deleteManager(id);
    res.status(200).json({
      success: true,
      message: 'Xóa manager thành công'
    });
  } catch (error) {
    console.error('Error deleting manager:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Lỗi xóa manager'
    });
  }
};

/**
 * Lấy danh sách theaters để assign
 */
export const getAvailableTheaters = async (req, res) => {
  try {
    const theaters = await managerService.getAvailableTheaters();
    res.status(200).json({
      success: true,
      data: theaters
    });
  } catch (error) {
    console.error('Error getting theaters:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi server'
    });
  }
};
