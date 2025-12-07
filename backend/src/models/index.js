import { sequelize } from '../libs/db.js';

import Role from './Role.js';
import User from './User.js';
import LoyaltyTierRate from './LoyaltyTierRate.js';
import LoyaltyAccount from './LoyaltyAccount.js';
import LoyaltyPointsTransaction from './LoyaltyPointsTransaction.js';
import LoyaltyTierRequirement from './LoyaltyTierRequirement.js';

import Movie from './Movie.js';
import Genre from './Genre.js';
import MovieGenre from './MovieGenre.js';

import Theater from './Theater.js';
import CinemaRoom from './CinemaRoom.js';
import Seat from './Seat.js';
import Showtime from './Showtime.js';
import Order from './Order.js';
import Ticket from './Ticket.js';
import SeatReservation from './SeatReservation.js';
import Payment from './Payment.js';
import Promotion from './Promotion.js';
import Combo from './Combo.js';
import ComboItem from './ComboItem.js';
import ComboOrder from './ComboOrder.js';
import GroupBooking from './GroupBooking.js';
import Invoice from './Invoice.js';
import NewsArticle from './NewsArticle.js';
import DailyStatistic from './DailyStatistic.js';
import Session from './Session.js';
import TokenBlacklist from './TokenBlacklist.js';

// --- Associations ---

// Role - User
Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });

// User - LoyaltyAccount
User.hasOne(LoyaltyAccount, { foreignKey: 'user_id' });
LoyaltyAccount.belongsTo(User, { foreignKey: 'user_id' });

// User - LoyaltyPointsTransaction
User.hasMany(LoyaltyPointsTransaction, { foreignKey: 'user_id' });
LoyaltyPointsTransaction.belongsTo(User, { foreignKey: 'user_id' });

// User - Session (1 user có thể có nhiều session)
User.hasMany(Session, { foreignKey: 'user_id' });
Session.belongsTo(User, { foreignKey: 'user_id' });


// Movie - Genre (Many-to-Many)
Movie.belongsToMany(Genre, { through: MovieGenre, foreignKey: 'movie_id', otherKey: 'genre_id' });
Genre.belongsToMany(Movie, { through: MovieGenre, foreignKey: 'genre_id', otherKey: 'movie_id' });

// Theater - CinemaRoom
Theater.hasMany(CinemaRoom, { foreignKey: 'theater_id' });
CinemaRoom.belongsTo(Theater, { foreignKey: 'theater_id' });

// CinemaRoom - Seat
CinemaRoom.hasMany(Seat, { foreignKey: 'room_id' });
Seat.belongsTo(CinemaRoom, { foreignKey: 'room_id' });

// Movie - Showtime
Movie.hasMany(Showtime, { foreignKey: 'movie_id' });
Showtime.belongsTo(Movie, { foreignKey: 'movie_id' });

// CinemaRoom - Showtime
CinemaRoom.hasMany(Showtime, { foreignKey: 'room_id' });
Showtime.belongsTo(CinemaRoom, { foreignKey: 'room_id' });

// User - Order
User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

// Order - Ticket
Order.hasMany(Ticket, { foreignKey: 'order_id' });
Ticket.belongsTo(Order, { foreignKey: 'order_id' });

// Showtime - Ticket
Showtime.hasMany(Ticket, { foreignKey: 'showtime_id' });
Ticket.belongsTo(Showtime, { foreignKey: 'showtime_id' });

// Seat - Ticket
Seat.hasMany(Ticket, { foreignKey: 'seat_id' });
Ticket.belongsTo(Seat, { foreignKey: 'seat_id' });

// Order - ComboOrder
Order.hasMany(ComboOrder, { foreignKey: 'order_id' });
ComboOrder.belongsTo(Order, { foreignKey: 'order_id' });

// Combo - ComboItem
Combo.hasMany(ComboItem, { foreignKey: 'combo_id' });
ComboItem.belongsTo(Combo, { foreignKey: 'combo_id' });

// Combo - ComboOrder
Combo.hasMany(ComboOrder, { foreignKey: 'combo_id' });
ComboOrder.belongsTo(Combo, { foreignKey: 'combo_id' });

// Order - Payment
Order.hasMany(Payment, { foreignKey: 'order_id' });
Payment.belongsTo(Order, { foreignKey: 'order_id' });

// NewsArticle - Movie (One-to-Many: Một phim có nhiều tin tức, một tin tức chỉ thuộc một phim)
NewsArticle.belongsTo(Movie, { foreignKey: 'movie_id', as: 'linkedMovie' });
Movie.hasMany(NewsArticle, { foreignKey: 'movie_id', as: 'newsArticles' });

// Nếu cần, thêm các association khác ở đây...

// --- Export tất cả ---

export {
    sequelize,
    Role,
    User,
    LoyaltyTierRate,
    LoyaltyAccount,
    LoyaltyPointsTransaction,
    LoyaltyTierRequirement,
    Movie,
    Genre,
    MovieGenre,
    Theater,
    CinemaRoom,
    Seat,
    Showtime,
    Order,
    Ticket,
    SeatReservation,
    Payment,
    Promotion,
    Combo,
    ComboItem,
    ComboOrder,
    GroupBooking,
    Invoice,
    NewsArticle,
    DailyStatistic,
    Session,
    TokenBlacklist,
};
