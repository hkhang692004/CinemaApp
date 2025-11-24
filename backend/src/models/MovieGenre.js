import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../libs/db.js';


export class MovieGenre extends Model { }
MovieGenre.init({
    movie_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, primaryKey: true },
    genre_id: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, primaryKey: true }
}, {
    sequelize,
    modelName: 'MovieGenre',
    tableName: 'movie_genres',
    timestamps: false
});


export default MovieGenre;