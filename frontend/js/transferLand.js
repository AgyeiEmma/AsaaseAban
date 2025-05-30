import { connectWallet } from "./web3.js";

// Fetch all lands (not just admin's)
export async function fetchAllLands() {
  try {
    console.log("Fetching all lands...");
    const response = await fetch(`http://localhost:8000/api/all-lands`);

    if (!response.ok) {
      throw new Error(`Failed to fetch all lands: ${response.status}`);
    }

    const lands = await response.json();
    console.log("Received all lands:", lands);
    return lands;
  } catch (error) {
    console.error("❌ Error fetching all lands:", error);
    return [];
  }
}

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
  const landsDropdown = document.getElementById("landsDropdown");
  const newOwner = document.getElementById("newOwner");
  const usersDropdown = document.getElementById("usersDropdown");

  if (!newOwner || !usersDropdown || !transferLandId || !landsDropdown) {
    console.error("Required elements not found for transfer land feature");
    return;
  }

  console.log("Found required elements");

  // Add click event listener to the Land ID input field
  transferLandId.addEventListener("click", async function () {
    console.log("Land ID input clicked");

    // Clear the dropdown
    landsDropdown.innerHTML = "";

    // Show loading indicator
    landsDropdown.innerHTML =
      '<div class="dropdown-item">Loading lands...</div>';
    landsDropdown.classList.add("active");

    try {
      // Fetch all lands, not just admin's lands
      const lands = await fetchAllLands();

      // Clear loading indicator
      landsDropdown.innerHTML = "";

      if (lands.length === 0) {
        landsDropdown.innerHTML =
          '<div class="dropdown-item">No lands found</div>';
        return;
      }

      console.log(`Found ${lands.length} lands to display`);

      // Populate dropdown with all lands
      lands.forEach((land) => {
        const item = document.createElement("div");
        item.className = "dropdown-item";

        const landId = land.land_id;
        // Get owner info from blockchain_id in the user_land table
        let ownerInfo = "Unknown owner";

        // Try to show owner info if available
        if (land.blockchain_id) {
          const shortOwner = `${land.blockchain_id.substring(
            0,
            6
          )}...${land.blockchain_id.substring(land.blockchain_id.length - 4)}`;
          ownerInfo = `Owner: ${shortOwner}`;
        }

        const landInfo = land.grantor
          ? `${land.grantor} - ${land.grantee || "N/A"}`
          : "Land";
        const acreage = land.acreage ? `${land.acreage} acres` : "No size data";

        item.innerHTML = `
          <div class="land-info">
            <strong>Land #${landId}</strong>
            <span class="land-details">${landInfo} (${acreage})</span>
            <span class="land-owner">${ownerInfo}</span>
          </div>
        `;

        item.addEventListener("click", () => {
          transferLandId.value = landId;
          landsDropdown.classList.remove("active");
        });

        landsDropdown.appendChild(item);
      });
    } catch (error) {
      console.error("Error loading lands:", error);
      landsDropdown.innerHTML = `<div class="dropdown-item">Error: ${error.message}</div>`;
    }
  });

  // Close Land ID dropdown when clicking outside
  document.addEventListener("click", (event) => {
    if (
      !transferLandId.contains(event.target) &&
      !landsDropdown.contains(event.target)
    ) {
      landsDropdown.classList.remove("active");
    }
  });

  // Add click event listener to the new owner input field
  newOwner.addEventListener("click", async function () {
    console.log("New owner input clicked");

    // Clear the dropdown
    usersDropdown.innerHTML = "";

    // Show loading indicator
    usersDropdown.innerHTML =
      '<div class="dropdown-item">Loading users...</div>';
    usersDropdown.classList.add("active");

    try {
      // Fetch all users
      const users = await fetchUsers();

      // Clear loading indicator
      usersDropdown.innerHTML = "";

      if (users.length === 0) {
        usersDropdown.innerHTML =
          '<div class="dropdown-item">No users found</div>';
        return;
      }

      console.log(`Found ${users.length} users to display`);

      // Populate dropdown with users (excluding the current admin)
      users.forEach((user) => {
        if (
          user.wallet_address === walletAddress ||
          user.blockchain_id === walletAddress
        )
          return; // Skip current admin

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

  // Close User dropdown when clicking outside
  document.addEventListener("click", (event) => {
    if (
      !newOwner.contains(event.target) &&
      !usersDropdown.contains(event.target)
    ) {
      usersDropdown.classList.remove("active");
    }
  });

  document
    .getElementById("transferLand")
    .addEventListener("click", async () => {
      try {
        const landId = document.getElementById("transferLandId").value;
        const newOwner = document.getElementById("newOwner").value;

        const response = await fetch(
          "http://localhost:8000/api/transfer-land",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              landId,
              newOwner,
              currentOwner: walletAddress,
            }),
          }
        );

        const data = await response.json();
        if (response.ok) {
          alert(data.message || "Land transferred successfully.");
        } else {
          alert(data.error || "Something went wrong.");
        }
      } catch (error) {
        console.error("❌ Error transferring land:", error);
        alert("Error transferring land: " + error.message);
      }
    });
}
