import cron from 'node-cron';
import { Showtime, TokenBlacklist, Order, Ticket, SeatReservation, LoyaltyAccount } from '../models/index.js';
import { reservationService } from '../services/reservationService.js';
import { Op } from 'sequelize';

/**
 * Cron job để tự động cập nhật status suất chiếu
 * Chạy mỗi 5 phút một lần
 * Cập nhật các suất chiếu có end_time < NOW thành "Completed"
 */
const initShowtimeStatusJob = () => {
  // Chạy mỗi 5 phút
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      
      // Find và update showtimes đã kết thúc
      const result = await Showtime.update(
        { status: 'Completed' },
        {
          where: {
            end_time: {
              [Op.lt]: now
            },
            status: 'Scheduled' // chỉ update những cái còn Scheduled
          }
        }
      );

      if (result[0] > 0) {
        console.log(`✅ [${new Date().toISOString()}] Updated ${result[0]} showtimes to Completed`);
      }
    } catch (error) {
      console.error('❌ Cron job error (updateShowtimeStatus):', error.message);
    }
  });

  console.log('✅ Showtime status cron job initialized (runs every 5 minutes)');
};

/**
 * Cron job auto-expire reservations
 * Chạy mỗi 1 phút
 * Expire các reservation đã hết hạn (expires_at < NOW)
 */
const initReservationExpiryJob = () => {
  cron.schedule('*/1 * * * *', async () => {
    try {
      const expiredCount = await reservationService.expireOldReservations();
      
      if (expiredCount > 0) {
        console.log(` [${new Date().toISOString()}] Expired ${expiredCount} reservations`);
      }
    } catch (error) {
      console.error(' Cron job error (expireReservations):', error.message);
    }
  });

  console.log('✅ Reservation expiry cron job initialized (runs every 1 minute)');
};

/**
 * Cron job clean up expired tokens from blacklist
 * Chạy mỗi ngày lúc 2:00 AM
 * Xóa các token đã expired khỏi blacklist
 */
const initTokenCleanupJob = () => {
  // Chạy mỗi ngày lúc 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      const now = new Date();
      
      // Xóa tokens đã expired
      const result = await TokenBlacklist.destroy({
        where: {
          expires_at: {
            [Op.lt]: now
          }
        }
      });

      if (result > 0) {
        console.log(`🗑️ [${new Date().toISOString()}] Cleaned up ${result} expired tokens from blacklist`);
      }
    } catch (error) {
      console.error('❌ Cron job error (tokenCleanup):', error.message);
    }
  });

  console.log('✅ Token blacklist cleanup cron job initialized (runs daily at 2:00 AM)');
};

/**
 * Cron job expire pending orders
 * Chạy mỗi 1 phút
 * Cancel các order Pending đã hết hạn (booking_expires_at < NOW)
 * Đồng thời release các ticket và seat reservation liên quan
 */
const initOrderExpiryJob = () => {
  cron.schedule('*/1 * * * *', async () => {
    try {
      const now = new Date();
      
      // Tìm các order pending đã hết hạn
      const expiredOrders = await Order.findAll({
        where: {
          status: 'Pending',
          booking_expires_at: {
            [Op.lt]: now
          }
        }
      });

      if (expiredOrders.length === 0) return;

      for (const order of expiredOrders) {
        // Cập nhật order status thành Cancelled
        await order.update({ status: 'Cancelled' });

        // Cập nhật tất cả tickets của order thành Cancelled
        await Ticket.update(
          { status: 'Cancelled' },
          { where: { order_id: order.id } }
        );

        // Lấy các ticket để release seat reservations
        const tickets = await Ticket.findAll({
          where: { order_id: order.id },
          attributes: ['showtime_id', 'seat_id']
        });

        // XÓA các seat reservations (thay vì update status)
        for (const ticket of tickets) {
          await SeatReservation.destroy({
            where: {
              showtime_id: ticket.showtime_id,
              seat_id: ticket.seat_id,
              status: { [Op.in]: ['Held', 'Confirmed'] }
            }
          });
        }
      }

      console.log(`🕐 [${new Date().toISOString()}] Expired ${expiredOrders.length} pending orders and released seats`);
    } catch (error) {
      console.error('❌ Cron job error (orderExpiry):', error.message);
    }
  });

  console.log('✅ Order expiry cron job initialized (runs every 1 minute)');
};

/**
 * Cron job reset yearly_spent vào đầu năm mới
 * Chạy lúc 00:01 ngày 1 tháng 1 hàng năm
 * Reset yearly_spent về 0 và hạ tier về Silver
 */
const initYearlyResetJob = () => {
  // Chạy lúc 00:01 ngày 1 tháng 1
  cron.schedule('1 0 1 1 *', async () => {
    try {
      const currentYear = new Date().getFullYear();
      
      // Reset tất cả loyalty accounts
      const [updatedCount] = await LoyaltyAccount.update(
        {
          yearly_spent: 0,
          spent_year: currentYear,
          tier: 'Silver' // Hạ tier về Silver đầu năm
        },
        {
          where: {
            spent_year: { [Op.lt]: currentYear }
          }
        }
      );

      console.log(`🎆 [${new Date().toISOString()}] New Year Reset: ${updatedCount} loyalty accounts reset to Silver`);
    } catch (error) {
      console.error('❌ Cron job error (yearlyReset):', error.message);
    }
  });

  console.log('✅ Yearly reset cron job initialized (runs at 00:01 on Jan 1st)');
};

export { initShowtimeStatusJob, initReservationExpiryJob, initTokenCleanupJob, initOrderExpiryJob, initYearlyResetJob };
export default initShowtimeStatusJob;
