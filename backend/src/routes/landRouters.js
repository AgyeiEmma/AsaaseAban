const express = require("express");
const router = express.Router();
const { registerLand, getLands, getLandDetails } = require("../controllers/landController");
const multer = require("multer");
const { uploadDocument } = require("../utils/ipfs.js");

// ✅ File Upload Setup
const upload = multer({ dest: "uploads/" });

router.post("/register", upload.single("document"), async (req, res) => {
    try {
        const { owner, location } = req.body;
        const documentUrl = await uploadDocument(req.file.path); // Upload file to IPFS

        if (!documentUrl) {
            return res.status(500).json({ error: "Failed to upload document" });
        }

        const [lat, lon] = location.split(",").map(Number);

        if (!lat || !lon) {
            return res.status(400).json({ error: "Invalid coordinates" });
        }

        // ✅ Insert land details into database
        const land = await registerLand({ owner, location, document: documentUrl });
        res.json({ message: "Land registered successfully!", land });
    } catch (error) {
        console.error("❌ Error registering land:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Get all lands
router.get("/lands", getLands);

// ✅ Get land details by ID
router.get("/land/:landId", getLandDetails);

module.exports = router;