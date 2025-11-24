import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class Role extends Model { }
Role.init({
    id: { type: DataTypes.TINYINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(20), allowNull: false, unique: true }
}, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: false
});


export default Role;