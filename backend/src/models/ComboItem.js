import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class ComboItem extends Model { }
ComboItem.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    combo_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    item_name: { type: DataTypes.STRING(200), allowNull: false },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 }
}, {
    sequelize,
    modelName: 'ComboItem',
    tableName: 'combo_items',
    timestamps: false
});


export default ComboItem;