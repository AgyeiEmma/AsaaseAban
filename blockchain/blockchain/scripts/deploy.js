const hre = require("hardhat");

async function main() {
    console.log(" Deploying LandRegistry contract...");

    const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
    const landRegistry = await LandRegistry.deploy();

    await landRegistry.waitForDeployment(); 

    console.log(`LandRegistry deployed at: ${landRegistry.target}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
