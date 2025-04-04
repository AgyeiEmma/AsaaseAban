import { connectWallet, registerLand, verifyLand, transferLand, getLandDetails, loadLands } from "./web3.js";

// ✅ Initialize Leaflet Map
let map = L.map("map").setView([5.6037, -0.1870], 10); // Accra default

// ✅ Add OpenStreetMap base layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

// ✅ Add GeoServer WMS layer (Asaase Aban lands)
L.tileLayer.wms("http://localhost:8080/geoserver/asaaseaban/wms", {
  layers: "asaaseaban:lands",
  format: "image/png",
  transparent: true,
  attribution: "Asaase Aban Land Registry",
}).addTo(map);

// ✅ Function to update map with land marker
function updateMapWithLand(land) {
  if (!land || !land.location) return;

  const [lat, lon] = land.location.split(",").map(Number);

  if (!isNaN(lat) && !isNaN(lon)) {
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    L.marker([lat, lon])
      .addTo(map)
      .bindPopup(`
        <b>Land ID:</b> ${land.id} <br>
        <b>Verified:</b> ${land.verified ? "✅ Yes" : "❌ No"}
      `)
      .openPopup();

    map.setView([lat, lon], 15);
  }
}

// ✅ DOM Ready
document.addEventListener("DOMContentLoaded", function () {
  // ✅ Connect Wallet and Redirect
  const connectBtn = document.getElementById("connectWallet");
  if (connectBtn) {
    connectBtn.addEventListener("click", async () => {
      const walletAddress = await connectWallet();
      if (walletAddress) {
        localStorage.setItem("walletAddress", walletAddress);
        window.location.href = "pages/user.html";
      }
    });
  }

  // ✅ Register Land
  document.getElementById("registerLand")?.addEventListener("click", async () => {
    const location = document.getElementById("location").value;
    const documentHash = document.getElementById("documentHash").value;

    if (!location || !documentHash) {
      alert("❌ Please fill in all fields.");
      return;
    }

    await registerLand(location, documentHash);
    await loadLands();
  });

  // ✅ Verify Land (Admin Only)
  document.getElementById("verifyLand")?.addEventListener("click", async () => {
    const landId = document.getElementById("verifyLandId").value;
    if (!landId) {
      alert("❌ Please enter a Land ID.");
      return;
    }

    await verifyLand(landId);
    await loadLands();
  });

  // ✅ Transfer Land Ownership
  document.getElementById("transferLand")?.addEventListener("click", async () => {
    const landId = document.getElementById("transferLandId").value;
    const newOwner = document.getElementById("newOwner").value;

    if (!landId || !newOwner) {
      alert("❌ Please enter Land ID and New Owner Address.");
      return;
    }

    await transferLand(landId, newOwner);
    await loadLands();
  });

  // ✅ Fetch Land Details by ID
  document.getElementById("fetchLand")?.addEventListener("click", async () => {
    const landId = document.getElementById("landId").value;
    if (!landId) {
      alert("❌ Please enter a Land ID.");
      return;
    }

    const landDetails = await getLandDetails(landId);
    if (!landDetails) {
      alert("❌ Land not found.");
    } else {
      updateMapWithLand(landDetails);
    }
  });
});
