// Backend route for land registration submissions
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("../database.js");

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../../uploads");
    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "land-doc-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: (req, file, cb) => {
    // Accept only specific file types
    const allowedTypes = [".pdf", ".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF and images are allowed."));
    }
  },
});

// POST endpoint for submitting land registration
router.post("/lands/register", upload.single("document"), async (req, res) => {
  console.log("===========================================");
  console.log("📥 Incoming request: POST /lands/register");

  try {
    // Extract data from request
    const { location, description, owner } = req.body;
    const documentPath = req.file ? req.file.path : null;

    console.log("📄 Document uploaded to:", documentPath);
    console.log("📍 Location:", location);
    console.log("👤 Owner:", owner);

    // Validate request
    if (!location || !documentPath || !owner) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Insert into land_submissions table
    const result = await pool.query(
      `INSERT INTO public.land_submissions 
       (location, document_path, description, owner_wallet, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, status, created_at`,
      [location, documentPath, description, owner, "pending"]
    );

    console.log("✅ Land submission recorded in database");

    res.status(201).json({
      success: true,
      message:
        "Land registration submitted successfully! Waiting for admin approval.",
      submissionId: result.rows[0].id,
    });
  } catch (error) {
    console.error("❌ Error processing land registration:", error);
    res.status(500).json({ error: "Internal Server Error: " + error.message });
  }
});

// GET endpoint to fetch pending submissions for a user
router.get("/lands/pending/:walletAddress", async (req, res) => {
  console.log("===========================================");
  console.log("📥 Incoming request: GET /lands/pending/:walletAddress");

  try {
    const { walletAddress } = req.params;

    const result = await pool.query(
      `SELECT id, location, document_path, description, status, created_at, updated_at
       FROM public.land_submissions
       WHERE owner_wallet = $1
       ORDER BY created_at DESC`,
      [walletAddress]
    );

    console.log(
      `✅ Found ${result.rows.length} submissions for wallet ${walletAddress}`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching pending submissions:", error);
    res.status(500).json({ error: "Internal Server Error: " + error.message });
  }
});

module.exports = router;
