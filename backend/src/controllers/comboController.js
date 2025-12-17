import * as comboService from '../services/comboService.js';

/**
 * Lấy tất cả combo
 */
export async function getAllCombos(req, res) {
    try {
        const combos = await comboService.getAllCombos();
        
        res.status(200).json({
            success: true,
            combos: combos.map(combo => ({
                id: combo.id,
                name: combo.name,
                description: combo.description,
                image_url: combo.image_url,
                price: parseFloat(combo.price),
                category: combo.category,
                items: combo.ComboItems?.map(item => ({
                    id: item.id,
                    name: item.item_name,
                    quantity: item.quantity
                })) || []
            }))
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
            combo: {
                id: combo.id,
                name: combo.name,
                description: combo.description,
                image_url: combo.image_url,
                price: parseFloat(combo.price),
                category: combo.category,
                items: combo.ComboItems?.map(item => ({
                    id: item.id,
                    name: item.item_name,
                    quantity: item.quantity
                })) || []
            }
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
            combos: combos.map(combo => ({
                id: combo.id,
                name: combo.name,
                description: combo.description,
                image_url: combo.image_url,
                price: parseFloat(combo.price),
                category: combo.category,
                items: combo.ComboItems?.map(item => ({
                    id: item.id,
                    name: item.item_name,
                    quantity: item.quantity
                })) || []
            }))
        });
    } catch (error) {
        console.error('Error in getCombosByCategory:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách combo theo category'
        });
    }
}
