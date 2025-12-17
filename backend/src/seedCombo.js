import { sequelize, Combo, ComboItem } from './models/index.js';

const combosData = [
    {
        name: 'Combo Solo',
        description: 'Combo dành cho 1 người: 1 Bắp rang bơ (Size M) + 1 Nước ngọt (Size M)',
        image_url: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400',
        price: 79000,
        category: 'Combo',
        is_active: true,
        items: [
            { item_name: 'Bắp rang bơ (M)', quantity: 1 },
            { item_name: 'Nước ngọt (M)', quantity: 1 }
        ]
    },
    {
        name: 'Combo Couple',
        description: 'Combo dành cho 2 người: 1 Bắp rang bơ (Size L) + 2 Nước ngọt (Size M)',
        image_url: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400',
        price: 109000,
        category: 'Combo',
        is_active: true,
        items: [
            { item_name: 'Bắp rang bơ (L)', quantity: 1 },
            { item_name: 'Nước ngọt (M)', quantity: 2 }
        ]
    },
    {
        name: 'Combo Family',
        description: 'Combo dành cho gia đình: 2 Bắp rang bơ (Size L) + 4 Nước ngọt (Size M)',
        image_url: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=400',
        price: 189000,
        category: 'Combo',
        is_active: true,
        items: [
            { item_name: 'Bắp rang bơ (L)', quantity: 2 },
            { item_name: 'Nước ngọt (M)', quantity: 4 }
        ]
    },
    {
        name: 'Combo Party',
        description: 'Combo tiệc lớn: 3 Bắp rang bơ (Size L) + 6 Nước ngọt (Size L) + 2 Hotdog',
        image_url: 'https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?w=400',
        price: 349000,
        category: 'Combo',
        is_active: true,
        items: [
            { item_name: 'Bắp rang bơ (L)', quantity: 3 },
            { item_name: 'Nước ngọt (L)', quantity: 6 },
            { item_name: 'Hotdog', quantity: 2 }
        ]
    },
    {
        name: 'Bắp rang bơ (M)',
        description: 'Bắp rang bơ thơm ngon size M',
        image_url: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400',
        price: 45000,
        category: 'Bắp',
        is_active: true,
        items: [
            { item_name: 'Bắp rang bơ (M)', quantity: 1 }
        ]
    },
    {
        name: 'Bắp rang bơ (L)',
        description: 'Bắp rang bơ thơm ngon size L',
        image_url: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400',
        price: 55000,
        category: 'Bắp',
        is_active: true,
        items: [
            { item_name: 'Bắp rang bơ (L)', quantity: 1 }
        ]
    },
    {
        name: 'Bắp phô mai',
        description: 'Bắp rang phô mai béo ngậy',
        image_url: 'https://images.unsplash.com/photo-1630384060421-cb20aeb56c3b?w=400',
        price: 59000,
        category: 'Bắp',
        is_active: true,
        items: [
            { item_name: 'Bắp phô mai', quantity: 1 }
        ]
    },
    {
        name: 'Bắp caramel',
        description: 'Bắp rang caramel ngọt ngào',
        image_url: 'https://images.unsplash.com/photo-1589476993333-f55b84301219?w=400',
        price: 59000,
        category: 'Bắp',
        is_active: true,
        items: [
            { item_name: 'Bắp caramel', quantity: 1 }
        ]
    },
    {
        name: 'Coca-Cola (M)',
        description: 'Nước ngọt Coca-Cola size M',
        image_url: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400',
        price: 32000,
        category: 'Nước uống',
        is_active: true,
        items: [
            { item_name: 'Coca-Cola (M)', quantity: 1 }
        ]
    },
    {
        name: 'Coca-Cola (L)',
        description: 'Nước ngọt Coca-Cola size L',
        image_url: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400',
        price: 39000,
        category: 'Nước uống',
        is_active: true,
        items: [
            { item_name: 'Coca-Cola (L)', quantity: 1 }
        ]
    },
    {
        name: 'Pepsi (M)',
        description: 'Nước ngọt Pepsi size M',
        image_url: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400',
        price: 32000,
        category: 'Nước uống',
        is_active: true,
        items: [
            { item_name: 'Pepsi (M)', quantity: 1 }
        ]
    },
    {
        name: 'Nước suối',
        description: 'Nước suối tinh khiết',
        image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
        price: 20000,
        category: 'Nước uống',
        is_active: true,
        items: [
            { item_name: 'Nước suối', quantity: 1 }
        ]
    },
    {
        name: 'Hotdog',
        description: 'Hotdog xúc xích thơm ngon',
        image_url: 'https://images.unsplash.com/photo-1612392062631-94e9f4a855c5?w=400',
        price: 45000,
        category: 'Đồ ăn',
        is_active: true,
        items: [
            { item_name: 'Hotdog', quantity: 1 }
        ]
    },
    {
        name: 'Nachos phô mai',
        description: 'Bánh Nachos với sốt phô mai',
        image_url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400',
        price: 55000,
        category: 'Đồ ăn',
        is_active: true,
        items: [
            { item_name: 'Nachos phô mai', quantity: 1 }
        ]
    },
    {
        name: 'Khoai tây chiên',
        description: 'Khoai tây chiên giòn rụm',
        image_url: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400',
        price: 39000,
        category: 'Đồ ăn',
        is_active: true,
        items: [
            { item_name: 'Khoai tây chiên', quantity: 1 }
        ]
    }
];

async function seedCombos() {
    try {
        await sequelize.authenticate();
        console.log('📦 Đang seed dữ liệu Combo...\n');

        // Xóa dữ liệu cũ
        await ComboItem.destroy({ where: {} });
        await Combo.destroy({ where: {} });
        console.log('🗑️ Đã xóa dữ liệu cũ\n');

        // Tạo combos và items
        for (const comboData of combosData) {
            const { items, ...comboInfo } = comboData;
            
            const combo = await Combo.create(comboInfo);
            console.log(`✅ Đã tạo: ${combo.name} - ${combo.price.toLocaleString('vi-VN')}đ`);

            // Tạo combo items
            for (const item of items) {
                await ComboItem.create({
                    combo_id: combo.id,
                    ...item
                });
            }
            console.log(`   📦 ${items.length} item(s)`);
        }

        console.log('\n🎉 Seed Combo hoàn tất!');
        console.log(`   - ${combosData.length} combos/items đã được tạo`);
        
    } catch (error) {
        console.error('❌ Lỗi seed Combo:', error);
    } finally {
        await sequelize.close();
    }
}

seedCombos();
