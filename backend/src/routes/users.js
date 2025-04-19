const express = require("express");
const router = express.Router();
const pool = require("../database");

// GET all users
router.get("/users", async (req, res) => {
  console.log("===========================================");
  console.log("📥 Incoming request: GET /users");

  try {
    const result = await pool.query(
      `SELECT id, name, wallet_address FROM public.users`
    );

    console.log("✅ Query successful.");
    console.log("📦 Returned users:", result.rows.length);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Database error:", err.message);
    res.status(500).json({ error: "Internal Server Error: " + err.message });
  }

  console.log("===========================================\n");
});

module.exports = router;
