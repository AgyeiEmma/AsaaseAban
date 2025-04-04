require("dotenv").config();
const { ethers } = require("ethers");

// Ensure environment variables are loaded correctly
console.log("SEPOLIA_RPC_URL:", process.env.SEPOLIA_RPC_URL);
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY);
console.log("CONTRACT_ADDRESS:", process.env.CONTRACT_ADDRESS);

// Initialize Ethereum provider
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Define the contract ABI
const contractABI = [
    "function landCounter() public view returns (uint256)", // Ensure this exists in your contract
    "function registerLand(string location, string documentHash) public",
    "function getLandDetails(uint256 landId) public view returns (address, string memory, string memory, bool, address[])"
];

// Load the deployed contract
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

console.log("✅ Contract Loaded Successfully at:", contract.address);

// Fetch the land counter
(async () => {
    try {
        console.log("✅ Fetching land counter...");
        const landCount = await contract.landCounter();
        console.log("🏡 Total Lands Registered:", landCount.toString());
    } catch (error) {
        console.error("Error fetching land count:", error);
    }
})();