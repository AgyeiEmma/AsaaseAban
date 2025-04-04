const { Web3Storage } = require("web3.storage");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

// ✅ Initialize Web3.storage client
const client = new Web3Storage({ token: process.env.WEB3_STORAGE_API_KEY });

// ✅ Upload Land Document
async function uploadDocument(filePath) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = filePath.split("/").pop(); // Get file name
        const file = new File([fileBuffer], fileName);

        const cid = await client.put([file]);
        console.log("✅ File uploaded successfully:", cid);

        return `https://${cid}.ipfs.w3s.link/${fileName}`; // Return the document's IPFS URL
    } catch (error) {
        console.error("❌ Error uploading file:", error);
        return null;
    }
}

module.exports = { uploadDocument };