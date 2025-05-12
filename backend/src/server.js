// server.js
require("dotenv").config();
const pool = require("./database.js");
const express = require("express");
const app = express(); // ✅ Define app before using it

const cors = require("cors");
app.use(cors()); // Enable CORS for all routes

const userLandsRoute = require("./routes/userLands");
const userRoutes = require("./routes/userRoutes"); // Import user routes
const landSubmissionsRoute = require("./routes/landSubmissions"); // Import land submissions route
const adminSubmissionsRoute = require("./routes/adminSubmissions"); // Import admin submissions route

app.use(express.json());
app.use(express.static("public")); // or your actual frontend folder

// ✅ Now this works because app is already defined
app.use("/api", userLandsRoute);
app.use("/api", userRoutes); // Add user routes
app.use("/api", landSubmissionsRoute); // Add land submissions route
app.use("/api", adminSubmissionsRoute); // Add admin submissions route

// ✅ Test DB Connection
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ DB Connected. Current Time:", result.rows[0].now);
    res.json({ status: "success", time: result.rows[0].now });
  } catch (err) {
    console.error("❌ DB Connection Failed:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Add a simple test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

const PORT = 8000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
