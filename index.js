const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.json());

const authRoutes = require('./routes/authRoutes');

app.use('/api/v1/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Server Backend Scrum berjalan!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});