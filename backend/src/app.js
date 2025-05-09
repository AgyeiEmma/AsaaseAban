const dotenv = require("dotenv");
const path = require("path");
const express = require("express");
const cors = require("cors");

// ✅ Resolve .env path
dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("🔍 SEPOLIA_RPC_URL:", process.env.SEPOLIA_RPC_URL);

// ✅ Correct path to landRoutes.js
const landRoutes = require("./routes/landRouters"); // ✅ Correct path
const transactionsRoutes = require("./routes/transactions");

const app = express();
app.use(express.json()); // Enable JSON request body parsing
app.use(cors()); // Enable CORS

app.get("/", (req, res) => {
  res.send("🚀 Asaase Aban Backend is Running!");
});

// ✅ Use the land registration routes
app.use("/api/land", landRoutes);

// ✅ Use the transactions routes
app.use("/api", transactionsRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
