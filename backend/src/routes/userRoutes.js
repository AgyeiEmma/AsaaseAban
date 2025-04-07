const express = require("express");
const router = express.Router();
const pool = require("../database");

// Get user info including role
router.get("/user/:wallet", async (req, res) => {
    const wallet = req.params.wallet;
    
    try {
        // Check if user exists and get role
        const result = await pool.query(
            "SELECT blockchain_id, user_role FROM users WHERE blockchain_id = $1",
            [wallet]
        );
        
        if (result.rows.length === 0) {
            // Create new user with default role (0 = regular user)
            await pool.query(
                "INSERT INTO users (blockchain_id, user_role) VALUES ($1, 0)",
                [wallet]
            );
            res.json({ blockchain_id: wallet, user_role: 0 });
        } else {
            res.json(result.rows[0]);
        }
    } catch (err) {
        console.error("Error fetching user:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;