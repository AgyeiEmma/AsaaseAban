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
        // Updated query to join user_land with romman to get geospatial data
        const result = await pool.query(
            `SELECT ul.id, ul.blockchain_id, ul.land_id, 
                    r.grantor, r.grantee, r.instrument, r.acreage, 
                    ST_AsGeoJSON(r.wkb_geometry) as geojson 
             FROM public.user_land ul
             JOIN public.romman r ON ul.land_id = r.ogc_fid
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

// GET all lands (for admin dashboard)
router.get("/all-lands", async (req, res) => {
    console.log("===========================================");
    console.log("📥 Incoming request: GET /all-lands");

    try {
        // Query to get all land parcels with geospatial data
        const result = await pool.query(
            `SELECT r.ogc_fid as land_id, r.grantor, r.grantee, r.instrument, 
                   r.acreage, ST_AsGeoJSON(r.wkb_geometry) as geojson 
             FROM public.romman r`
        );

        console.log("✅ Query successful.");
        console.log("📦 Returned rows:", result.rows.length);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Database error:", err.message);
        res.status(500).json({ error: "Internal Server Error: " + err.message });
    }

    console.log("===========================================\n");
});

module.exports = router;
