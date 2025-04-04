const axios = require("axios");  // Ensure you have axios installed: `npm install axios`

const API_BASE_URL = "http://localhost:5001/api/land";

// ✅ Test Functions
async function testGetAllLands() {
    try {
        console.log("📍 Fetching all registered lands...");
        const response = await axios.get(`${API_BASE_URL}/lands`);
        console.log("✅ Lands Fetched Successfully:", response.data);
    } catch (error) {
        console.error("❌ Error Fetching Lands:", error.response ? error.response.data : error.message);
    }
}

async function testRegisterLand() {
    try {
        console.log("📝 Registering a new land...");
        const payload = {
            owner: "0x1234567890abcdef1234567890abcdef12345678",
            location: "5.6037,-0.1870",
            document: "QmXyz123456789abcdef"
        };
        const response = await axios.post(`${API_BASE_URL}/register`, payload, {
            headers: { "Content-Type": "application/json" }
        });
        console.log("✅ Land Registered Successfully:", response.data);
    } catch (error) {
        console.error("❌ Error Registering Land:", error.response ? error.response.data : error.message);
    }
}

// Function to run all tests
async function runTests() {
    await testGetAllLands();
    await testRegisterLand();
}

// ✅ Execute Tests
runTests();