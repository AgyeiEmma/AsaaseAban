import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.6.2/dist/ethers.min.js";

const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS"; // Replace with actual contract address
const contractABI = [
    "function landCounter() public view returns (uint256)",
    "function getLandDetails(uint256) public view returns (address,string,string,bool,bool,address[])",
    "function registerLand(string memory, string memory) public",
    "function verifyLand(uint256) public",
    "function verifyDocument(uint256) public",
    "function transferLand(uint256, address) public"
];

let provider;
let signer;
let contract;

// ✅ Connect Wallet
export async function connectWallet() {
    if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractABI, signer);

        const walletAddress = await signer.getAddress();
        document.getElementById("walletAddress").innerHTML = `🟢 Connected: <a href="https://sepolia.etherscan.io/address/${walletAddress}" target="_blank">${walletAddress}</a>`;
        // window.location.href = 'pages/user.html';
        return walletAddress;
    } else {
        alert("❌ Please install MetaMask!");
    }
}

// ✅ Get Land Details
export async function getLandDetails(landId) {
    try {
        if (!contract) await connectWallet();
        const land = await contract.getLandDetails(landId);
        return {
            id: landId,
            owner: land[0],
            location: land[1],
            documentHash: land[2],
            verified: land[3],
            documentVerified: land[4],
            ownershipHistory: land[5],
        };
    } catch (error) {
        console.error("❌ Error Fetching Land Details:", error);
        return null;
    }
}

// ✅ Register Land
export async function registerLand(location, documentHash) {
    try {
        if (!contract) await connectWallet();
        const tx = await contract.registerLand(location, documentHash);
        await tx.wait();
        alert("✅ Land Registered Successfully!");
    } catch (error) {
        console.error("❌ Error Registering Land:", error);
    }
}

// ✅ Verify Document (Admin Only)
export async function verifyDocument(landId) {
    try {
        if (!contract) await connectWallet();
        const tx = await contract.verifyDocument(landId);
        await tx.wait();
        alert("✅ Document Verified!");
    } catch (error) {
        console.error("❌ Error Verifying Document:", error);
    }
}

// ✅ Verify Land (Admin Only)
export async function verifyLand(landId) {
    try {
        if (!contract) await connectWallet();
        
        const land = await contract.getLandDetails(landId);
        if (!land.documentVerified) {
            alert("❌ You must verify the document first!");
            return;
        }

        const tx = await contract.verifyLand(landId);
        await tx.wait();
        alert("✅ Land Verified!");
    } catch (error) {
        console.error("❌ Error Verifying Land:", error);
    }
}
// ✅ Check Land Existence
export async function checkLandExistence(location) {
    try {
        if (!contract) await connectWallet();

        const landCounter = await contract.landCounter(); // Get the total number of registered lands

        for (let i = 1; i <= landCounter; i++) {
            const land = await contract.getLandDetails(i);

            // Compare the location of the current land with the input location
            if (land[1] === location) {
                return {
                    exists: true,
                    id: i,
                    owner: land[0],
                    documentHash: land[2],
                    verified: land[3],
                    documentVerified: land[4],
                    ownershipHistory: land[5],
                };
            }
        }

        // If no match is found, return that the land does not exist
        return { exists: false };
    } catch (error) {
        console.error("❌ Error Checking Land Existence:", error);
        return { exists: false, error: error.message };
    }
}

// ✅ Transfer Land
export async function transferLand(landId, newOwner) {
    try {
        if (!contract) await connectWallet();
        const tx = await contract.transferLand(landId, newOwner);
        await tx.wait();
        alert("✅ Land Transferred!");
    } catch (error) {
        console.error("❌ Error Transferring Land:", error);
    }
}

// ✅ Load Registered Lands
export async function loadLands() {
    try {
        if (!contract) await connectWallet();
        const landCounter = await contract.landCounter();
        const landList = document.getElementById("landList");
        landList.innerHTML = "";

        for (let i = 1; i <= landCounter; i++) {
            const land = await getLandDetails(i);
            if (land) {
                const listItem = document.createElement("li");
                listItem.innerHTML = `<b>ID:</b> ${i} | <b>Owner:</b> ${land.owner} | <b>Verified:</b> ${land.verified ? "✅ Yes" : "❌ No"}`;
                landList.appendChild(listItem);
            }
        }
    } catch (error) {
        console.error("❌ Error Loading Lands:", error);
    }
}