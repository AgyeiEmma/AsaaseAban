const { ethers } = require("ethers");
const { Network, Alchemy } = require("alchemy-sdk");
require("dotenv").config();

const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL;
const privateKey = process.env.PRIVATE_KEY;

if (!sepoliaRpcUrl) {
    throw new Error("SEPOLIA_RPC_URL is not defined in the environment variables.");
}

if (!privateKey) {
    throw new Error("PRIVATE_KEY is not defined in the environment variables.");
}

console.log("SEPOLIA_RPC_URL:", sepoliaRpcUrl);
console.log("PRIVATE_KEY:", privateKey);

const provider = new ethers.providers.JsonRpcProvider(sepoliaRpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

const contractAddress = process.env.CONTRACT_ADDRESS; // Use the contract address from the environment variables
const contractABI = [
    "function landCounter() public view returns (uint256)",
    "function getLandDetails(uint256) public view returns (address,string,string,bool,bool,address[])",
    "function registerLand(string memory, string memory) public",
    "function verifyLand(uint256) public",
    "function verifyDocument(uint256) public",
    "function transferLand(uint256, address) public"
];

const contract = new ethers.Contract(contractAddress, contractABI, wallet);

// Alchemy SDK setup
const settings = {
    apiKey: process.env.ALCHEMY_API_KEY, // Replace with your Alchemy API Key
    network: Network.ETH_SEPOLIA, // Replace with your network
};
const alchemy = new Alchemy(settings);

alchemy.core.getBlock(15221026).then(console.log);

const registerLandOnBlockchain = async (location, documentHash) => {
    const tx = await contract.registerLand(location, documentHash);
    await tx.wait();
    return tx.hash;
};

const getLandDetailsFromBlockchain = async (landId) => {
    const landDetails = await contract.getLandDetails(landId);
    return {
        id: landId,
        owner: landDetails[0],
        location: landDetails[1],
        documentHash: landDetails[2],
        verified: landDetails[3],
        documentVerified: landDetails[4],
        ownershipHistory: landDetails[5],
    };
};

module.exports = {
    registerLandOnBlockchain,
    getLandDetailsFromBlockchain
};