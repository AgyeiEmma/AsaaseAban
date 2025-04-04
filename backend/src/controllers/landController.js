const { registerLandOnBlockchain, getLandDetailsFromBlockchain } = require("../services/blockchainService");
const pool = require("../database.js");
const ethers = require("ethers");

// ✅ Register a new land
const registerLand = async (req, res) => {
    try {
        const { owner, location, document } = req.body;

        // ✅ Validate request data
        if (!owner || !location || !document) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        // ✅ Simulate document hashing (Later, use IPFS)
        const documentHash = ethers.keccak256(ethers.toUtf8Bytes(document));

        // ✅ Register land on the blockchain
        const transactionHash = await registerLandOnBlockchain(location, documentHash);

        // ✅ Insert land details into PostGIS database
        const query = "INSERT INTO lands (geometry, owner, document_hash) VALUES (ST_GeomFromText($1, 4326), $2, $3) RETURNING id;";
        const values = [`POINT(${location})`, owner, documentHash];
        const result = await pool.query(query, values);

        res.status(201).json({
            message: "Land registered successfully on blockchain and in the database!",
            transactionHash,
            landId: result.rows[0].id
        });
    } catch (error) {
        console.error("❌ Error registering land:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// ✅ Get all lands from PostGIS
const getLands = async (req, res) => {
    try {
        const result = await pool.query("SELECT id, ST_AsGeoJSON(geometry) as geojson, owner, verified FROM lands;");
        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error fetching lands:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ✅ Get land details from blockchain
const getLandDetails = async (req, res) => {
    try {
        const { landId } = req.params;
        const landDetails = await getLandDetailsFromBlockchain(landId);
        res.json(landDetails);
    } catch (error) {
        console.error("❌ Error fetching land details:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    registerLand,
    getLands,
    getLandDetails
};