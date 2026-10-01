const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true // Penting untuk TiDB Cloud
  }
});

db.connect((err) => {
  if (err) {
    console.error('Koneksi TiDB Cloud Gagal:', err.message);
  } else {
    console.log('Berhasil terhubung ke Database MySQL di TiDB Cloud!');
  }
});

module.exports = db;