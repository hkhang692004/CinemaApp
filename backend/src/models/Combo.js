import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class Combo extends Model { }
Combo.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT },
    image_url: { type: DataTypes.STRING(500) },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    category: { type: DataTypes.STRING(50) },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    modelName: 'Combo',
    tableName: 'combos',
    timestamps: false
});


export default Combo;