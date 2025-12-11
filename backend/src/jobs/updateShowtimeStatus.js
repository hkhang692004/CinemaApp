import cron from 'node-cron';
import { Showtime } from '../models/index.js';
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

export default initShowtimeStatusJob;
