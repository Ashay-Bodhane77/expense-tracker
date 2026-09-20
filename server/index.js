const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

app.get('/', (req, res) => {
  res.send('Expense Tracker API is running 🚀');
});

app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Database connected ✅', time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection failed ❌' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});