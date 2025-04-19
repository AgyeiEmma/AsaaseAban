import { connectWallet } from "./web3.js";

// Fetch lands owned by the current admin
export async function fetchAdminLands(walletAddress) {
  try {
    console.log("Fetching lands for wallet:", walletAddress);
    const response = await fetch(
      `http://localhost:8000/api/user-lands/${walletAddress}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch lands: ${response.status}`);
    }

    const lands = await response.json();
    console.log("Received lands:", lands);
    return lands;
  } catch (error) {
    console.error("❌ Error fetching admin lands:", error);
    return [];
  }
}

// Fetch all users from the database
export async function fetchUsers() {
  try {
    console.log("Fetching users...");
    const response = await fetch("http://localhost:8000/api/users");

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`);
    }

    const users = await response.json();
    console.log("Received users:", users);
    return users;
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    return [];
  }
}

// Setup the transfer land functionality
export function setupTransferLandFeature(walletAddress) {
  console.log("Setting up transfer land feature for wallet:", walletAddress);
  
  const transferLandId = document.getElementById("transferLandId");
  const newOwner = document.getElementById("newOwner");
  const usersDropdown = document.getElementById("usersDropdown");

  if (!newOwner || !usersDropdown) {
    console.error("Required elements not found for transfer land feature");
    return;
  }

  console.log("Found required elements:", { transferLandId, newOwner, usersDropdown });

  // Add click event listener to the new owner input field
  newOwner.addEventListener("click", async function() {
    console.log("New owner input clicked");
    
    // Clear the dropdown
    usersDropdown.innerHTML = "";

    // Show loading indicator
    usersDropdown.innerHTML = '<div class="dropdown-item">Loading users...</div>';
    usersDropdown.classList.add("active");

    try {
      // Fetch all users
      const users = await fetchUsers();

      // Clear loading indicator
      usersDropdown.innerHTML = "";

      if (users.length === 0) {
        usersDropdown.innerHTML = '<div class="dropdown-item">No users found</div>';
        return;
      }

      console.log(`Found ${users.length} users to display`);

      // Populate dropdown with users (excluding the current admin)
      users.forEach((user) => {
        if (user.wallet_address === walletAddress || user.blockchain_id === walletAddress) return; // Skip current admin

        const item = document.createElement("div");
        item.className = "dropdown-item";

        // Adjust based on your actual database schema
        const userAddress = user.wallet_address || user.blockchain_id;
        const userName = user.name || "User";

        item.innerHTML = `
          <div class="user-info">
            <strong>${userName}</strong>
            <span class="wallet">${userAddress}</span>
          </div>
        `;

        item.addEventListener("click", () => {
          newOwner.value = userAddress;
          usersDropdown.classList.remove("active");
        });

        usersDropdown.appendChild(item);
      });
    } catch (error) {
      console.error("Error loading users:", error);
      usersDropdown.innerHTML = `<div class="dropdown-item">Error: ${error.message}</div>`;
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (event) => {
    if (!newOwner.contains(event.target) && !usersDropdown.contains(event.target)) {
      usersDropdown.classList.remove("active");
    }
  });
}
