import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class Movie extends Model { }
Movie.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(300), allowNull: false },
    description: { type: DataTypes.TEXT },
    trailer_url: { type: DataTypes.STRING(500) },
    poster_url: { type: DataTypes.STRING(500) },
    backdrop_url: { type: DataTypes.STRING(500) },
    duration_min: { type: DataTypes.SMALLINT },
    director: { type: DataTypes.STRING(200) },
    actors: { type: DataTypes.TEXT },
    language: { type: DataTypes.STRING(50) },
    country: { type: DataTypes.STRING(50) },
    release_date: { type: DataTypes.DATEONLY },
    status: { type: DataTypes.ENUM('coming_soon', 'now_showing', 'ended'), defaultValue: 'coming_soon' },
    avg_rating: { type: DataTypes.DECIMAL(2, 1), defaultValue: 0 },
    total_reviews: { type: DataTypes.INTEGER, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    modelName: 'Movie',
    tableName: 'movies',
    timestamps: false
});


export default Movie;