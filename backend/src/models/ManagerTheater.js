import { Model, DataTypes } from "sequelize";
import { sequelize } from "../libs/db.js";

export class ManagerTheater extends Model {}
ManagerTheater.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    theater_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    assigned_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "ManagerTheater",
    tableName: "manager_theaters",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "theater_id"],
      },
    ],
  }
);

export default ManagerTheater;
