require('dotenv').config();
const express = require('express');
const cors = require('cors');


// Panggil file koneksi database
require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Server backend berhasil berjalan!' });
});

app.listen(PORT, () => {
  console.log(`Server running di http://localhost:${PORT}`);
});