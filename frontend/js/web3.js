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

export async function connectWallet() {
    if (!window.ethereum) {
        alert("❌ Please install MetaMask!");
        return;
    }
    
    try {
        // First get any already-connected accounts
        const connectedAccounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        // Show dialog with existing connected accounts and option to connect new one
        const selection = await showImprovedAccountDialog(connectedAccounts);
        
        if (!selection) return null; // User cancelled
        
        let selectedAccount;
        
        // If user chose to connect new account
        if (selection === 'new_account') {
            try {
                // This will trigger MetaMask to show the account selector
                const newAccounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                
                if (newAccounts && newAccounts.length > 0) {
                    selectedAccount = newAccounts[0]; // MetaMask returns the selected account
                } else {
                    throw new Error("No account selected");
                }
            } catch (error) {
                console.error("Failed to connect new account:", error);
                return null;
            }
        } else {
            // User selected an existing account
            selectedAccount = selection;
        }
        
        // Initialize provider, signer and contract with selected account
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner(selectedAccount);
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        
        // Update UI
        const walletElement = document.getElementById("walletAddress");
        if (walletElement) {
            walletElement.innerHTML = 
                `🟢 Connected: <a href="https://sepolia.etherscan.io/address/${selectedAccount}" target="_blank">${selectedAccount.substring(0, 6)}...${selectedAccount.substring(selectedAccount.length - 4)}</a>`;
        }
        
        return selectedAccount;
    } catch (error) {
        console.error("❌ Error connecting wallet:", error);
        alert("Failed to connect wallet: " + error.message);
    }
}

// Improved account dialog with better readability and visual hierarchy
function showImprovedAccountDialog(connectedAccounts) {
    return new Promise((resolve) => {
        // Create modal backdrop
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '1000';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = '#ffffff';
        modalContent.style.borderRadius = '12px';
        modalContent.style.padding = '24px';
        modalContent.style.width = '400px';
        modalContent.style.maxWidth = '90%';
        modalContent.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
        modalContent.style.fontSize = '16px';
        
        const hasExistingAccounts = connectedAccounts && connectedAccounts.length > 0;
        
        modalContent.innerHTML = `
            <h3 style="margin-top:0;color:#1a1a1a;font-size:22px;font-weight:600;margin-bottom:12px">Connect to Asaase Aban</h3>
            ${hasExistingAccounts ? 
                `<p style="color:#444444;margin-bottom:16px;font-size:16px">Select an already connected account:</p>` : 
                `<p style="color:#444444;margin-bottom:16px;font-size:16px">No accounts connected yet.</p>`
            }
            <div id="accountList" style="margin:20px 0"></div>
        `;
        
        // Add accounts to selection list
        const accountList = document.createElement('div');
        
        // Add previously connected accounts
        if (hasExistingAccounts) {
            connectedAccounts.forEach((account, index) => {
                const accountBtn = document.createElement('button');
                accountBtn.style.display = 'flex';
                accountBtn.style.alignItems = 'center';
                accountBtn.style.width = '100%';
                accountBtn.style.padding = '14px 16px';
                accountBtn.style.margin = '10px 0';
                accountBtn.style.backgroundColor = '#f8f9fa';
                accountBtn.style.border = '1px solid #dee2e6';
                accountBtn.style.borderRadius = '8px';
                accountBtn.style.cursor = 'pointer';
                accountBtn.style.textAlign = 'left';
                accountBtn.style.transition = 'all 0.2s ease';
                accountBtn.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                accountBtn.style.fontSize = '15px';
                
                accountBtn.innerHTML = `
                    <div style="background:#28a745;width:12px;height:12px;border-radius:50%;margin-right:12px"></div>
                    <span style="flex-grow:1;color:#212529;font-weight:500">Account ${index + 1}: ${account.slice(0, 6)}...${account.slice(-4)}</span>
                `;
                
                accountBtn.addEventListener('mouseover', () => {
                    accountBtn.style.backgroundColor = '#e9ecef';
                    accountBtn.style.borderColor = '#ced4da';
                });
                
                accountBtn.addEventListener('mouseout', () => {
                    accountBtn.style.backgroundColor = '#f8f9fa';
                    accountBtn.style.borderColor = '#dee2e6';
                });
                
                accountBtn.addEventListener('click', () => {
                    document.body.removeChild(modal);
                    resolve(account);
                });
                
                accountList.appendChild(accountBtn);
            });
            
            const divider = document.createElement('hr');
            divider.style.margin = '20px 0';
            divider.style.border = '0';
            divider.style.height = '1px';
            divider.style.backgroundColor = '#e9ecef';
            accountList.appendChild(divider);
        }
        
        // "Connect new account" button
        const newAccountBtn = document.createElement('button');
        newAccountBtn.style.display = 'flex';
        newAccountBtn.style.alignItems = 'center';
        newAccountBtn.style.width = '100%';
        newAccountBtn.style.padding = '14px 16px';
        newAccountBtn.style.margin = '10px 0';
        newAccountBtn.style.backgroundColor = '#e6f7ff';
        newAccountBtn.style.border = '1px solid #91d5ff';
        newAccountBtn.style.borderRadius = '8px';
        newAccountBtn.style.cursor = 'pointer';
        newAccountBtn.style.textAlign = 'left';
        newAccountBtn.style.transition = 'all 0.2s ease';
        newAccountBtn.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        newAccountBtn.style.fontSize = '15px';
        
        newAccountBtn.innerHTML = `
            <div style="background:#1890ff;width:12px;height:12px;border-radius:50%;margin-right:12px"></div>
            <span style="flex-grow:1;color:#0050b3;font-weight:500">Connect new account</span>
        `;
        
        newAccountBtn.addEventListener('mouseover', () => {
            newAccountBtn.style.backgroundColor = '#bae7ff';
            newAccountBtn.style.borderColor = '#69c0ff';
        });
        
        newAccountBtn.addEventListener('mouseout', () => {
            newAccountBtn.style.backgroundColor = '#e6f7ff';
            newAccountBtn.style.borderColor = '#91d5ff';
        });
        
        newAccountBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve('new_account');
        });
        
        accountList.appendChild(newAccountBtn);
        
        // Add cancel button
        const divider = document.createElement('hr');
        divider.style.margin = '20px 0';
        divider.style.border = '0';
        divider.style.height = '1px';
        divider.style.backgroundColor = '#e9ecef';
        accountList.appendChild(divider);
        
        const buttonsRow = document.createElement('div');
        buttonsRow.style.display = 'flex';
        buttonsRow.style.justifyContent = 'flex-end';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.padding = '10px 20px';
        cancelBtn.style.backgroundColor = '#f8f9fa';
        cancelBtn.style.color = '#495057';
        cancelBtn.style.border = '1px solid #ced4da';
        cancelBtn.style.borderRadius = '6px';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.style.fontSize = '14px';
        cancelBtn.style.fontWeight = '500';
        cancelBtn.style.transition = 'all 0.2s ease';
        
        cancelBtn.addEventListener('mouseover', () => {
            cancelBtn.style.backgroundColor = '#e9ecef';
        });
        
        cancelBtn.addEventListener('mouseout', () => {
            cancelBtn.style.backgroundColor = '#f8f9fa';
        });
        
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(null);
        });
        
        buttonsRow.appendChild(cancelBtn);
        accountList.appendChild(buttonsRow);
        
        modalContent.querySelector('#accountList').appendChild(accountList);
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    });
}

/**
 * Checks the role of a user (admin or regular user) by querying the backend API.
 *
 * @param {string} walletAddress - The wallet address of the user to check.
 * @returns {Promise<number>} Returns the user role (0 = regular user, 1 = admin).
 * @throws {Error} If the API request fails, an error is thrown.
 *
 * The backend API is queried to get the user's role.
 * If there's an error, the function returns 0 (regular user).
 * @async
 */
export async function checkUserRole(walletAddress) {
    try {
        // Query the backend API to get the user's role
        const response = await fetch(`http://localhost:8000/api/user/${walletAddress}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const userData = await response.json();
        return userData.user_role;
    } catch (error) {
        console.error("Error checking user role:", error);
        // Default to regular user if there's an error
        return 0;
    }
}

/**
 * Checks the role of a user (admin or regular user) by querying the backend API.
 *
 * @param {string} walletAddress - The wallet address of the user to check.
 * @returns {Promise<number>} Returns the user role (0 = regular user, 1 = admin).
 */

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