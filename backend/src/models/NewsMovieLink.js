import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class NewsMovieLink extends Model { }
NewsMovieLink.init({
    news_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, primaryKey: true },
    movie_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, primaryKey: true }
}, {
    sequelize,
    modelName: 'NewsMovieLink',
    tableName: 'news_movie_links',
    timestamps: false
});


export default NewsMovieLink;