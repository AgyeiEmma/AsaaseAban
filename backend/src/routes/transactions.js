const express = require("express");
const router = express.Router();
const pool = require("../database");

// GET all transactions
router.get("/transactions", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id AS transaction_id,
        t.type AS transaction_type,
        t.land_id,
        t.timestamp,
        t.initiator,
        t.recipient
      FROM public.transactions t
      ORDER BY t.timestamp DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching transactions:", err.message);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

module.exports = router;
