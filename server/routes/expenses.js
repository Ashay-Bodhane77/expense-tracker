const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post('/', async (req, res) => {
  try {
    const { title, amount, category, expense_date } = req.body;

    if (!title || !amount || !category) {
      return res.status(400).json({ error: 'Title, amount and category are required' });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const result = await pool.query(
      `INSERT INTO expenses (user_id, title, amount, category, expense_date)
       VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE))
       RETURNING *`,
      [req.userId, title, amount, category, expense_date || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM expenses WHERE user_id = $1 ORDER BY expense_date DESC, id DESC',
      [req.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.put('/:id', async (req, res) => {
  try {
    const { title, amount, category, expense_date } = req.body;

    if (!title || !amount || !category) {
      return res.status(400).json({ error: 'Title, amount and category are required' });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const result = await pool.query(
      `UPDATE expenses
       SET title = $1, amount = $2, category = $3, expense_date = COALESCE($4, expense_date)
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [title, amount, category, expense_date || null, req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    const result = await pool.query(
      `SELECT category, SUM(amount) AS total, COUNT(*) AS count
       FROM expenses
       WHERE user_id = $1
         AND EXTRACT(MONTH FROM expense_date) = $2
         AND EXTRACT(YEAR FROM expense_date) = $3
       GROUP BY category
       ORDER BY total DESC`,
      [req.userId, month, year]
    );

    const byCategory = result.rows.map((row) => ({
      category: row.category,
      total: Number(row.total),
      count: Number(row.count),
    }));

    const total = byCategory.reduce((sum, row) => sum + row.total, 0);

    res.json({ month, year, total, byCategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
module.exports = router;