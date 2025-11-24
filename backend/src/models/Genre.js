import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class Genre extends Model { }
Genre.init({
    id: { type: DataTypes.SMALLINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true }
}, {
    sequelize,
    modelName: 'Genre',
    tableName: 'genres',
    timestamps: false
});


export default Genre;