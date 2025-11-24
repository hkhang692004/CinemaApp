import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class Theater extends Model { }
Theater.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    address: { type: DataTypes.TEXT },
    city: { type: DataTypes.STRING(100) },
    phone: { type: DataTypes.STRING(30) },
    email: { type: DataTypes.STRING(100) },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
    sequelize,
    modelName: 'Theater',
    tableName: 'theaters',
    timestamps: false
});


export default Theater;