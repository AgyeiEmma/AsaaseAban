const { ethers } = require("ethers");
require("dotenv").config();

const contractAddress = process.env.CONTRACT_ADDRESS;
const contractABI = require("./artifacts/contracts/LandRegistry.sol/LandRegistry.json").abi;

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(contractAddress, contractABI, signer);

console.log("✅ Connected to Smart Contract at:", contractAddress);
