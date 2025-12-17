import { sequelize } from './libs/db.js';
import Role from './models/Role.js';

async function seedRoles() {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối database thành công');

    // Clear existing roles (optional - comment out nếu muốn giữ)
    // await Role.destroy({ where: {} });
    // console.log('🗑️  Xóa roles cũ');

    // Insert roles
    const roles = [
      { name: 'user' },
      { name: 'admin' },
    ];

    for (const role of roles) {
      const [createdRole, created] = await Role.findOrCreate({
        where: { name: role.name },
        defaults: role,
      });

      if (created) {
        console.log(`✅ Thêm role '${role.name}' thành công`);
      } else {
        console.log(`⚠️  Role '${role.name}' đã tồn tại`);
      }
    }

    console.log('✅ Seed roles hoàn tất');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

seedRoles();
