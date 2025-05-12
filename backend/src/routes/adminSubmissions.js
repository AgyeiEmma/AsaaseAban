// Admin routes for managing land submissions
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const pool = require("../database.js");

// GET endpoint to fetch all submissions with pagination, filtering and search
router.get("/admin/submissions", async (req, res) => {
  console.log("===========================================");
  console.log("📥 Incoming request: GET /admin/submissions");

  try {
    const { page = 1, limit = 10, status = "", search = "" } = req.query;
    const offset = (page - 1) * limit;

    // Build the query
    let query = `
      SELECT 
        id, location, document_path, description, owner_wallet, 
        status, created_at, updated_at, admin_notes, reviewed_by
      FROM public.land_submissions
    `;

    let countQuery = `SELECT COUNT(*) FROM public.land_submissions`;
    let queryParams = [];
    let conditions = [];

    // Add status filter if specified
    if (status) {
      conditions.push(`status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }

    // Add search filter if specified
    if (search) {
      conditions.push(`(
        location ILIKE $${queryParams.length + 1} OR
        description ILIKE $${queryParams.length + 1} OR
        owner_wallet ILIKE $${queryParams.length + 1}
      )`);
      queryParams.push(`%${search}%`);
    }

    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(" AND ")}`;
      query += whereClause;
      countQuery += whereClause;
    }

    // Add ORDER BY and LIMIT clauses
    query += ` ORDER BY created_at DESC LIMIT $${
      queryParams.length + 1
    } OFFSET $${queryParams.length + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    // Execute queries
    const [submissionsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)), // Remove LIMIT and OFFSET params
    ]);

    const submissions = submissionsResult.rows;
    const total = parseInt(countResult.rows[0].count);

    console.log(`✅ Found ${submissions.length} submissions. Total: ${total}`);

    res.json({
      submissions,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("❌ Error fetching submissions:", error);
    res.status(500).json({ error: "Internal Server Error: " + error.message });
  }
});

// GET endpoint to fetch a single submission by ID
router.get("/admin/submissions/:id", async (req, res) => {
  console.log("===========================================");
  console.log(`📥 Incoming request: GET /admin/submissions/${req.params.id}`);

  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        id, location, document_path, description, owner_wallet,
        status, created_at, updated_at, admin_notes, reviewed_by
       FROM public.land_submissions
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Submission not found" });
    }

    console.log(`✅ Found submission with ID ${id}`);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error fetching submission:", error);
    res.status(500).json({ error: "Internal Server Error: " + error.message });
  }
});

// POST endpoint to review a submission (approve/reject)
router.post("/admin/submissions/:id/review", async (req, res) => {
  console.log("===========================================");
  console.log(
    `📥 Incoming request: POST /admin/submissions/${req.params.id}/review`
  );

  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    // Validate status
    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Invalid status. Must be 'approved' or 'rejected'" });
    }

    // Start a transaction
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // First update the submission status
      const updateResult = await client.query(
        `UPDATE public.land_submissions
         SET status = $1, 
             admin_notes = $2, 
             updated_at = NOW(),
             reviewed_by = $3
         WHERE id = $4
         RETURNING *`,
        [status, adminNotes || null, "admin", id] // You might want to replace 'admin' with actual admin ID
      );

      if (updateResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Submission not found" });
      }

      const updatedSubmission = updateResult.rows[0];

      // If approved, add to lands table
      if (status === "approved") {
        console.log(`✅ Submission ${id} approved. Adding to lands table...`);

        // Insert into lands table
        await client.query(
          `INSERT INTO public.lands 
           (location, document_path, owner_wallet, created_at)
           VALUES ($1, $2, $3, NOW())
           RETURNING id`,
          [
            updatedSubmission.location,
            updatedSubmission.document_path,
            updatedSubmission.owner_wallet,
          ]
        );
      }

      await client.query("COMMIT");

      console.log(`✅ Submission ${id} ${status}`);

      res.json({
        success: true,
        message: `Submission has been ${status}`,
        submission: updatedSubmission,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Error reviewing submission:", error);
    res.status(500).json({ error: "Internal Server Error: " + error.message });
  }
});

// GET endpoint to serve document files
router.get("/documents/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "../../uploads", filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error("❌ Error serving document:", error);
    res.status(500).json({ error: "Internal Server Error: " + error.message });
  }
});

module.exports = router;
