import { Model, DataTypes } from "sequelize";
import { sequelize } from "../libs/db.js";
import Role from "./Role.js";

export class User extends Model {}
User.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    role_id: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    full_name: { type: DataTypes.STRING(200) },
    phone: { type: DataTypes.STRING(20) },
    avatar_url: { type: DataTypes.STRING(500) },
    date_of_birth: { type: DataTypes.DATEONLY },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    otp_code: { type: DataTypes.STRING(6) },
    otp_expires: { type: DataTypes.DATE },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: false,
  }
);

export default User;
