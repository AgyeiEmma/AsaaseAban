// backend/routes/userLands.js
const express = require("express");
const router = express.Router();
const pool = require("../database");

// GET lands for a specific blockchain user
router.get("/user-lands/:wallet", async (req, res) => {
    const wallet = req.params.wallet;
    console.log("===========================================");
    console.log("📥 Incoming request: GET /user-lands/:wallet");
    console.log("🧾 Wallet from request:", wallet);

    try {
        const result = await pool.query(
            `SELECT ul.*, 
                    l.verified, 
                    l.document_hash,
                    ST_AsGeoJSON(l.geometry) as geojson 
             FROM public.user_land ul
             JOIN lands l ON ul.land_id = l.id
             WHERE ul.blockchain_id = $1`,
            [wallet]
        );

        console.log("✅ Query successful.");
        console.log("📦 Returned rows:", result.rows.length);
        if (result.rows.length > 0) {
            console.log("🔗 First result:", result.rows[0]);
        }

        res.json(result.rows);
    } catch (err) {
        console.error("❌ Database error:", err.message);
        res.status(500).json({ error: "Internal Server Error: " + err.message });
    }

    console.log("===========================================\n");
});

module.exports = router;
