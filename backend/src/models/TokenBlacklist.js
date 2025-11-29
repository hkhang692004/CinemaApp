import { Model, DataTypes } from "sequelize";
import { sequelize } from "../libs/db.js";

export class TokenBlacklist extends Model { }

TokenBlacklist.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    token: {
        type: DataTypes.STRING(500),   
        allowNull: false,
        unique: true,
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    modelName: "TokenBlacklist",
    tableName: "token_blacklist",
    timestamps: false,
});

export default TokenBlacklist;
