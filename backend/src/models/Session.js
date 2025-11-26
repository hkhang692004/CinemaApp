import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';

export class Session extends Model { }

Session.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    refresh_token: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    modelName: 'Session',
    tableName: 'sessions',
    timestamps: false,
});

export default Session;
