import { Combo, ComboItem } from '../models/index.js';

/**
 * Lấy danh sách tất cả combo đang hoạt động
 */
export async function getAllCombos() {
    try {
        const combos = await Combo.findAll({
            where: { is_active: true },
            include: [{
                model: ComboItem,
                as: 'ComboItems'
            }],
            order: [['category', 'ASC'], ['price', 'ASC']]
        });
        
        return combos;
    } catch (error) {
        console.error('Error fetching combos:', error);
        throw error;
    }
}

/**
 * Lấy chi tiết một combo theo ID
 */
export async function getComboById(comboId) {
    try {
        const combo = await Combo.findByPk(comboId, {
            include: [{
                model: ComboItem,
                as: 'ComboItems'
            }]
        });
        
        return combo;
    } catch (error) {
        console.error('Error fetching combo:', error);
        throw error;
    }
}

/**
 * Lấy danh sách combo theo category
 */
export async function getCombosByCategory(category) {
    try {
        const combos = await Combo.findAll({
            where: { 
                is_active: true,
                category: category 
            },
            include: [{
                model: ComboItem,
                as: 'ComboItems'
            }],
            order: [['price', 'ASC']]
        });
        
        return combos;
    } catch (error) {
        console.error('Error fetching combos by category:', error);
        throw error;
    }
}

export default {
    getAllCombos,
    getComboById,
    getCombosByCategory
};
