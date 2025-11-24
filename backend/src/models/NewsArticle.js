import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class NewsArticle extends Model { }
NewsArticle.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(300), allowNull: false },
    summary: { type: DataTypes.TEXT },
    content: { type: DataTypes.TEXT, allowNull: false },
    image_url: { type: DataTypes.STRING(500) },
    published_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    author: { type: DataTypes.STRING(100) },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    modelName: 'NewsArticle',
    tableName: 'news_articles',
    timestamps: false
});


export default NewsArticle;