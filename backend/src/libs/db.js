import mysql from 'mysql2/promise';
import dotenv from "dotenv"

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0

})

pool.getConnection()
  .then(connection => {
    console.log('Kết nối CSDL thành công!');
    connection.release();
  })
  .catch(err => {
    console.error('Lỗi kết nối database:', err.message);
    process.exit(1);
  });

export default pool;