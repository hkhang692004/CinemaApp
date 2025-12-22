import * as comboService from '../services/comboService.js';
import { emitToAdmin, emitToClients, SOCKET_EVENTS } from '../socket.js';
import { uploadComboImage } from '../libs/cloudinary.js';

// Helper format combo
const formatCombo = (combo) => ({
    id: combo.id,
    name: combo.name,
    description: combo.description,
    image_url: combo.image_url,
    price: parseFloat(combo.price),
    category: combo.category,
    is_active: combo.is_active,
    created_at: combo.created_at,
    order_count: combo.order_count || 0,
    items: combo.ComboItems?.map(item => ({
        id: item.id,
        name: item.item_name,
        quantity: item.quantity
    })) || []
});

/**
 * Lấy tất cả combo (admin)
 */
export async function getAllCombosAdmin(req, res) {
    try {
        const { search, category, isActive, page, limit } = req.query;
        const result = await comboService.getAllCombosAdmin({ search, category, isActive, page, limit });
        
        res.json({
            combos: result.combos.map(formatCombo),
            total: result.total,
            page: result.page,
            totalPages: result.totalPages
        });
    } catch (error) {
        console.error('Error in getAllCombosAdmin:', error);
        res.status(500).json({ message: 'Lỗi lấy danh sách combo' });
    }
}

/**
 * Lấy tất cả combo
 */
export async function getAllCombos(req, res) {
    try {
        const combos = await comboService.getAllCombos();
        
        res.status(200).json({
            success: true,
            combos: combos.map(formatCombo)
        });
    } catch (error) {
        console.error('Error in getAllCombos:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách combo'
        });
    }
}

/**
 * Lấy chi tiết combo
 */
export async function getComboById(req, res) {
    try {
        const { id } = req.params;
        const combo = await comboService.getComboById(id);
        
        if (!combo) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy combo'
            });
        }
        
        res.status(200).json({
            success: true,
            combo: formatCombo(combo)
        });
    } catch (error) {
        console.error('Error in getComboById:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy chi tiết combo'
        });
    }
}

/**
 * Lấy combo theo category
 */
export async function getCombosByCategory(req, res) {
    try {
        const { category } = req.params;
        const combos = await comboService.getCombosByCategory(category);
        
        res.status(200).json({
            success: true,
            combos: combos.map(formatCombo)
        });
    } catch (error) {
        console.error('Error in getCombosByCategory:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách combo theo category'
        });
    }
}

/**
 * Tạo combo mới
 */
export async function createCombo(req, res) {
    try {
        const combo = await comboService.createCombo(req.body);
        const formatted = formatCombo(combo);
        
        // Emit socket event
        emitToAdmin(SOCKET_EVENTS.COMBO_CREATED, { combo: formatted });
        emitToClients(SOCKET_EVENTS.COMBO_CREATED, { combo: formatted });
        
        res.status(201).json({
            message: 'Tạo combo thành công',
            combo: formatted
        });
    } catch (error) {
        console.error('Error in createCombo:', error);
        res.status(400).json({ message: error.message || 'Lỗi tạo combo' });
    }
}

/**
 * Cập nhật combo
 */
export async function updateCombo(req, res) {
    try {
        const { id } = req.params;
        const combo = await comboService.updateCombo(id, req.body);
        const formatted = formatCombo(combo);
        
        // Emit socket event
        emitToAdmin(SOCKET_EVENTS.COMBO_UPDATED, { combo: formatted });
        emitToClients(SOCKET_EVENTS.COMBO_UPDATED, { combo: formatted });
        
        res.json({
            message: 'Cập nhật combo thành công',
            combo: formatted
        });
    } catch (error) {
        console.error('Error in updateCombo:', error);
        res.status(400).json({ message: error.message || 'Lỗi cập nhật combo' });
    }
}

/**
 * Xóa combo
 */
export async function deleteCombo(req, res) {
    try {
        const { id } = req.params;
        const result = await comboService.deleteCombo(id);
        
        // Emit socket event
        emitToAdmin(SOCKET_EVENTS.COMBO_DELETED, { comboId: parseInt(id), softDeleted: result.softDeleted });
        emitToClients(SOCKET_EVENTS.COMBO_DELETED, { comboId: parseInt(id), softDeleted: result.softDeleted });
        
        res.json({
            message: result.softDeleted 
                ? 'Combo đã được ẩn (đang có đơn hàng sử dụng)' 
                : 'Xóa combo thành công'
        });
    } catch (error) {
        console.error('Error in deleteCombo:', error);
        res.status(400).json({ message: error.message || 'Lỗi xóa combo' });
    }
}

/**
 * Lấy thống kê combo
 */
export async function getComboStats(req, res) {
    try {
        const stats = await comboService.getComboStats();
        res.json({ stats });
    } catch (error) {
        console.error('Error in getComboStats:', error);
        res.status(500).json({ message: 'Lỗi lấy thống kê combo' });
    }
}

/**
 * Lấy danh sách categories
 */
export async function getCategories(req, res) {
    try {
        const categories = await comboService.getCategories();
        res.json({ categories });
    } catch (error) {
        console.error('Error in getCategories:', error);
        res.status(500).json({ message: 'Lỗi lấy danh sách category' });
    }
}

/**
 * Upload ảnh combo
 */
export async function uploadImage(req, res) {
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ message: 'Không có ảnh được gửi lên' });
        }
        const result = await uploadComboImage(image);
        res.json({ url: result.url });
    } catch (error) {
        console.error('Error in uploadImage:', error);
        res.status(500).json({ message: error.message || 'Lỗi upload ảnh' });
    }
}
