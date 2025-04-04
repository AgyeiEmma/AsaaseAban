require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

console.log("SEPOLIA_RPC_URL:", process.env.SEPOLIA_RPC_URL);
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY);
console.log("ETHERSCAN_API_KEY:", process.env.ETHERSCAN_API_KEY);

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "MISSING_RPC_URL",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : ["MISSING_PRIVATE_KEY"],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "MISSING_ETHERSCAN_API_KEY",
  },
};