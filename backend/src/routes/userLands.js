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
    // Improved query with better GeoJSON formatting and filtering
    const result = await pool.query(
      `SELECT r.ogc_fid as land_id, 
              r.grantor, 
              r.grantee, 
              r.instrument, 
              r.acreage, 
              ST_AsGeoJSON(r.wkb_geometry) as geojson,
              ul.blockchain_id
       FROM public.romman r
       LEFT JOIN public.user_land ul ON r.ogc_fid = ul.land_id
       WHERE r.wkb_geometry IS NOT NULL 
         AND ST_IsValid(r.wkb_geometry)`
    );

    console.log(
      "✅ Query successful. Returned land count:",
      result.rows.length
    );

    // Process the rows to ensure valid GeoJSON
    const processedRows = result.rows.map((row) => {
      try {
        if (row.geojson) {
          // Parse and re-stringify to ensure it's a clean JSON string
          const geojson = JSON.parse(row.geojson);
          row.geojson = JSON.stringify(geojson);
        }
        return row;
      } catch (e) {
        console.warn(`Invalid GeoJSON for land #${row.land_id}: ${e.message}`);
        // Return row without the problematic geojson field
        const { geojson, ...rest } = row;
        return rest;
      }
    });

    res.json(processedRows);
  } catch (err) {
    console.error("❌ Database error:", err.message);
    res.status(500).json({ error: "Internal Server Error: " + err.message });
  }

  console.log("===========================================\n");
});

// POST route to transfer land ownership
router.post("/transfer-land", async (req, res) => {
  console.log("===========================================");
  console.log("📥 Incoming request: POST /transfer-land");

  const { landId, newOwner, currentOwner } = req.body;

  console.log("🧾 Transfer details:", {
    landId,
    from: currentOwner,
    to: newOwner,
  });

  if (!landId || !newOwner) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check if the land exists (but don't restrict to current owner - admin can transfer any land)
    const checkResult = await pool.query(
      `SELECT * FROM public.user_land WHERE land_id = $1`,
      [landId]
    );

    if (checkResult.rows.length === 0) {
      // Land isn't assigned to anyone yet, we need to insert a new record
      console.log("✅ Land not yet in user_land table, creating new record");

      // Check if new owner exists in users table
      const userCheck = await pool.query(
        `SELECT blockchain_id FROM public.users WHERE blockchain_id = $1`,
        [newOwner]
      );

      if (userCheck.rows.length === 0) {
        // New owner doesn't exist yet, add them to users table
        await pool.query(
          `INSERT INTO public.users (blockchain_id) VALUES ($1)`,
          [newOwner]
        );
        console.log("✅ Added new user to database:", newOwner);
      }

      // Insert new land ownership record
      await pool.query(
        `INSERT INTO public.user_land (land_id, blockchain_id) VALUES ($1, $2)`,
        [landId, newOwner]
      );

      console.log("✅ New land ownership record created");
      return res.json({ success: true, message: "Land assigned successfully" });
    }

    // Land exists, update the owner
    // Check if new owner exists in users table
    const userCheck = await pool.query(
      `SELECT blockchain_id FROM public.users WHERE blockchain_id = $1`,
      [newOwner]
    );

    if (userCheck.rows.length === 0) {
      // New owner doesn't exist yet, add them to users table
      await pool.query(`INSERT INTO public.users (blockchain_id) VALUES ($1)`, [
        newOwner,
      ]);
      console.log("✅ Added new user to database:", newOwner);
    }

    // Update the land ownership
    await pool.query(
      `UPDATE public.user_land 
             SET blockchain_id = $1 
             WHERE land_id = $2`,
      [newOwner, landId]
    );

    console.log("✅ Land transferred successfully");
    res.json({ success: true, message: "Land transferred successfully" });
  } catch (err) {
    console.error("❌ Database error:", err.message);
    res.status(500).json({ error: "Internal Server Error: " + err.message });
  }

  console.log("===========================================\n");
});

module.exports = router;
