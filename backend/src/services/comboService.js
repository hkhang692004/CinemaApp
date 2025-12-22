import { Combo, ComboItem, ComboOrder, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Lấy danh sách tất cả combo (admin - bao gồm cả inactive)
 */
export async function getAllCombosAdmin(filters = {}) {
    const { search, category, isActive, page = 1, limit = 20 } = filters;
    
    const where = {};
    
    if (search) {
        where.name = { [Op.like]: `%${search}%` };
    }
    
    if (category) {
        where.category = category;
    }
    
    if (isActive !== undefined && isActive !== '') {
        where.is_active = isActive === 'true' || isActive === true;
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Combo.findAndCountAll({
        where,
        include: [{
            model: ComboItem,
            as: 'ComboItems'
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset,
        distinct: true
    });
    
    // Get order count for each combo
    const comboIds = rows.map(c => c.id);
    const orderCounts = await ComboOrder.findAll({
        attributes: [
            'combo_id',
            [sequelize.fn('COUNT', sequelize.col('combo_id')), 'order_count']
        ],
        where: { combo_id: comboIds },
        group: ['combo_id'],
        raw: true
    });
    
    const orderCountMap = {};
    orderCounts.forEach(item => {
        orderCountMap[item.combo_id] = parseInt(item.order_count);
    });
    
    // Attach order_count to each combo
    const combosWithOrderCount = rows.map(combo => ({
        ...combo.toJSON(),
        order_count: orderCountMap[combo.id] || 0
    }));
    
    return {
        combos: combosWithOrderCount,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
    };
}

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

/**
 * Tạo combo mới
 */
export async function createCombo(data) {
    const transaction = await sequelize.transaction();
    
    try {
        const { name, description, image_url, price, category, items } = data;
        
        // Validate
        if (!name || !name.trim()) {
            throw new Error('Tên combo là bắt buộc');
        }
        if (!price || parseFloat(price) <= 0) {
            throw new Error('Giá phải lớn hơn 0');
        }
        if (!category || !category.trim()) {
            throw new Error('Danh mục là bắt buộc');
        }
        if (!items || items.length === 0) {
            throw new Error('Combo phải có ít nhất 1 món');
        }
        
        const combo = await Combo.create({
            name: name.trim(),
            description: description?.trim() || null,
            image_url: image_url || null,
            price,
            category: category?.trim() || null,
            is_active: true
        }, { transaction });
        
        // Tạo combo items
        if (items && items.length > 0) {
            const comboItems = items.map(item => ({
                combo_id: combo.id,
                item_name: item.item_name || item.name,
                quantity: item.quantity || 1
            }));
            await ComboItem.bulkCreate(comboItems, { transaction });
        }
        
        await transaction.commit();
        
        return await getComboById(combo.id);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

/**
 * Cập nhật combo
 */
export async function updateCombo(comboId, data) {
    const transaction = await sequelize.transaction();
    
    try {
        const combo = await Combo.findByPk(comboId, { transaction });
        
        if (!combo) {
            throw new Error('Không tìm thấy combo');
        }
        
        const { name, description, image_url, price, category, is_active, items } = data;
        
        await combo.update({
            name: name !== undefined ? name : combo.name,
            description: description !== undefined ? description : combo.description,
            image_url: image_url !== undefined ? image_url : combo.image_url,
            price: price !== undefined ? price : combo.price,
            category: category !== undefined ? category : combo.category,
            is_active: is_active !== undefined ? is_active : combo.is_active
        }, { transaction });
        
        // Nếu có items, xóa cũ và tạo mới
        if (items !== undefined) {
            await ComboItem.destroy({
                where: { combo_id: comboId },
                transaction
            });
            
            if (items.length > 0) {
                const comboItems = items.map(item => ({
                    combo_id: comboId,
                    item_name: item.item_name || item.name,
                    quantity: item.quantity || 1
                }));
                await ComboItem.bulkCreate(comboItems, { transaction });
            }
        }
        
        await transaction.commit();
        
        return await getComboById(comboId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

/**
 * Xóa combo
 */
export async function deleteCombo(comboId) {
    const combo = await Combo.findByPk(comboId);
    
    if (!combo) {
        throw new Error('Không tìm thấy combo');
    }
    
    // Kiểm tra xem combo có đang được sử dụng trong đơn hàng không
    const orderCount = await ComboOrder.count({
        where: { combo_id: comboId }
    });
    
    if (orderCount > 0) {
        throw new Error('Không thể xóa combo đã được sử dụng trong đơn hàng');
    } else {
        // Hard delete
        await ComboItem.destroy({ where: { combo_id: comboId } });
        await combo.destroy();
        return { softDeleted: false };
    }
}

/**
 * Lấy thống kê combo
 */
export async function getComboStats() {
    const totalCombos = await Combo.count();
    const activeCombos = await Combo.count({ where: { is_active: true } });
    
    // Combo bán chạy nhất
    const topCombosRaw = await ComboOrder.findAll({
        attributes: [
            'combo_id',
            [sequelize.fn('SUM', sequelize.col('ComboOrder.quantity')), 'total_sold'],
            [sequelize.fn('SUM', sequelize.col('ComboOrder.total_price')), 'total_revenue']
        ],
        include: [{
            model: Combo,
            attributes: ['id', 'name', 'image_url', 'price']
        }],
        group: ['combo_id', 'Combo.id', 'Combo.name', 'Combo.image_url', 'Combo.price'],
        order: [[sequelize.literal('total_sold'), 'DESC']],
        limit: 5,
        raw: false
    });
    
    // Format topCombos
    const topCombos = topCombosRaw.map(item => ({
        id: item.Combo?.id || item.combo_id,
        name: item.Combo?.name || 'Unknown',
        image_url: item.Combo?.image_url,
        price: item.Combo?.price ? parseFloat(item.Combo.price) : 0,
        totalSold: parseInt(item.getDataValue('total_sold')) || 0,
        totalRevenue: parseFloat(item.getDataValue('total_revenue')) || 0
    }));
    
    // Doanh thu combo
    const totalRevenue = await ComboOrder.sum('total_price') || 0;
    
    return {
        totalCombos,
        activeCombos,
        topCombos,
        totalRevenue: parseFloat(totalRevenue)
    };
}

/**
 * Lấy danh sách categories
 */
export async function getCategories() {
    const categories = await Combo.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
        where: { category: { [Op.ne]: null } },
        raw: true
    });
    
    return categories.map(c => c.category).filter(Boolean);
}

export default {
    getAllCombos,
    getAllCombosAdmin,
    getComboById,
    getCombosByCategory,
    createCombo,
    updateCombo,
    deleteCombo,
    getComboStats,
    getCategories
};
