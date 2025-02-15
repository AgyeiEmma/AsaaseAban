require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // ✅ Ensures .env is loaded

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "MISSING_RPC_URL",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : ["MISSING_PRIVATE_KEY"],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "MISSING_ETHERSCAN_API_KEY",
  },
};
