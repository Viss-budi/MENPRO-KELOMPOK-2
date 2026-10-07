const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // DATETIME dikirim sebagai string, tidak digeser timezone
  ssl: process.env.DB_SSL === 'false'
    ? undefined
    : { minVersion: 'TLSv1.2', rejectUnauthorized: true }, // wajib untuk TiDB Cloud
});

// Samakan zona waktu sesi database dengan WIB (TiDB Cloud default UTC)
pool.on('connection', (conn) => conn.query("SET time_zone = '+07:00'"));

const db = pool.promise();

db.query('SELECT 1')
  .then(() => console.log('Berhasil terhubung ke Database MySQL di TiDB Cloud!'))
  .catch((err) => console.error('Koneksi TiDB Cloud Gagal:', err.message));

module.exports = db;
