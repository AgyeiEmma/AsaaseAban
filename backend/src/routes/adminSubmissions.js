// Admin routes for managing land submissions
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pool = require('../database.js');

// GET endpoint to fetch all submissions with pagination, filtering and search
router.get('/admin/submissions', async (req, res) => {
  console.log("===========================================");
  console.log("📥 Incoming request: GET /admin/submissions");
  
  try {
    const { page = 1, limit = 10, status = '', search = '' } = req.query;
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
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      query += whereClause;
      countQuery += whereClause;
    }
    
    // Add ORDER BY and LIMIT clauses
    query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));
    
    // Execute queries
    const [submissionsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)) // Remove LIMIT and OFFSET params
    ]);
    
    const submissions = submissionsResult.rows;
    const total = parseInt(countResult.rows[0].count);
    
    console.log(`✅ Found ${submissions.length} submissions. Total: ${total}`);
    
    res.json({
      submissions,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
    
  } catch (error) {
    console.error("❌ Error fetching submissions:", error);
    res.status(500).json({ error: "Internal Server Error: " + error.message });
  }
});

// GET endpoint to fetch a single submission by ID
router.get('/admin/submissions/:id', async (req, res) => {
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
router.post('/admin/submissions/:id/review', async (req, res) => {
  console.log("===========================================");
  console.log(`📥 Incoming request: POST /admin/submissions/${req.params.id}/review`);
  
  try {
    const { id } = req.params;
    const { status, adminNotes, reviewedBy } = req.body;
    
    console.log(`📝 Review action: ${status}`);
    console.log(`📝 Admin notes: ${adminNotes || 'None'}`);
    console.log(`📝 Reviewed by: ${reviewedBy || 'Unknown'}`);
    
    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be 'approved' or 'rejected'" });
    }
    
    // Begin transaction
    await pool.query('BEGIN');
    
    try {
      // First update the submission status
      const updateResult = await pool.query(
        `UPDATE public.land_submissions
         SET status = $1, 
             admin_notes = $2, 
             updated_at = NOW(),
             reviewed_by = $3
         WHERE id = $4
         RETURNING *`,
        [status, adminNotes || null, reviewedBy || 'admin', id]
      );
      
      if (updateResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({ error: "Submission not found" });
      }
      
      const updatedSubmission = updateResult.rows[0];
      
      // If approved, add to lands table
      if (status === 'approved') {
        console.log(`✅ Submission ${id} approved. Adding to lands table...`);
        
        try {
          // Create lands table if needed
          await pool.query(`
            CREATE TABLE IF NOT EXISTS public.lands (
              id SERIAL PRIMARY KEY,
              location TEXT NOT NULL,
              document_path TEXT,
              owner_wallet TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP
            )
          `);
          
          // Insert into lands table
          await pool.query(
            `INSERT INTO public.lands 
             (location, document_path, owner_wallet, created_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING id`,
            [updatedSubmission.location, updatedSubmission.document_path, updatedSubmission.owner_wallet]
          );
          
          console.log(`✅ Land added to lands table`);
        } catch (error) {
          console.error("❌ Error adding to lands table:", error);
          await pool.query('ROLLBACK');
          throw error;
        }
      }
      
      await pool.query('COMMIT');
      
      console.log(`✅ Submission ${id} ${status}`);
      
      res.json({
        success: true,
        message: `Submission has been ${status}`,
        submission: updatedSubmission
      });
      
    } catch (err) {
      await pool.query('ROLLBACK');
      console.error("❌ Transaction error:", err.message);
      throw err;
    }
    
  } catch (error) {
    console.error("❌ Error reviewing submission:", error);
    res.status(500).json({ error: "Internal Server Error: " + error.message });
  }
});

// GET endpoint to serve document files
router.get('/documents/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads', filename);
    
    console.log(`📄 Serving document: ${filename}`);
    console.log(`📄 Full path: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Document not found: ${filename}`);
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
