import { sequelize } from './libs/db.js';
import Role from './models/Role.js';
import User from './models/User.js';
import bcrypt from 'bcrypt';

async function seedRolesAndAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối database thành công');

    // Insert roles
    const roles = [
      { name: 'user' },
      { name: 'admin' },
      { name: 'manager' },
    ];

    let adminRoleId = null;

    for (const role of roles) {
      const [createdRole, created] = await Role.findOrCreate({
        where: { name: role.name },
        defaults: role,
      });

      if (role.name === 'admin') {
        adminRoleId = createdRole.id;
      }

      if (created) {
        console.log(`✅ Thêm role '${role.name}' thành công`);
      } else {
        console.log(`⚠️  Role '${role.name}' đã tồn tại`);
      }
    }

    // Tạo tài khoản admin
    const adminEmail = 'admin@absolutecinema.com';
    const adminPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const [adminUser, adminCreated] = await User.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        email: adminEmail,
        password_hash: hashedPassword,
        full_name: 'Administrator',
        role_id: adminRoleId,
        is_active: true,
      },
    });

    if (adminCreated) {
      console.log(`✅ Tạo tài khoản admin thành công`);
      console.log(`   📧 Email: ${adminEmail}`);
      console.log(`   🔑 Password: ${adminPassword}`);
    } else {
      console.log(`⚠️  Tài khoản admin đã tồn tại`);
    }

    console.log('\n✅ Seed hoàn tất!');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

seedRolesAndAdmin();
