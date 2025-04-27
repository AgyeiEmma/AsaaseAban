// Function to display all registered lands on admin dashboard
export function displayAllLands(map) {
  const allLandsContainer = document.getElementById("allLandsContainer");
  const allLandsList = document.getElementById("allLandsList");
  const loadingLands = document.getElementById("loadingLands");

  if (!allLandsContainer || !allLandsList) {
    console.error("Required DOM elements not found:", {
      allLandsContainer: !!allLandsContainer,
      allLandsList: !!allLandsList,
    });
    return;
  }

  // Show loading message
  if (loadingLands) {
    loadingLands.style.display = "block";
    loadingLands.textContent = "Loading all lands...";
  }

  // Clear any existing markers with proper check to avoid errors
  if (window.adminLandLayers && Array.isArray(window.adminLandLayers)) {
    window.adminLandLayers.forEach((layer) => {
      if (map && layer) map.removeLayer(layer);
    });
  }
  window.adminLandLayers = [];

  // Clear existing list
  allLandsList.innerHTML = "";

  // Fetch all lands
  console.log("Fetching lands from API...");
  fetch("http://localhost:8000/api/all-lands")
    .then((response) => {
      console.log("API response status:", response.status);
      if (!response.ok) {
        throw new Error(`Failed to fetch lands: ${response.status}`);
      }
      return response.json();
    })
    .then((lands) => {
      // Hide loading message
      if (loadingLands) loadingLands.style.display = "none";

      console.log("Received lands data:", lands);

      // Check if we have lands
      if (!lands || lands.length === 0) {
        allLandsList.innerHTML =
          '<p class="no-lands">No registered lands found.</p>';
        return;
      }

      // Display lands in list
      allLandsList.innerHTML = "";

      // Create bounds to fit all land features
      const bounds = L.latLngBounds();

      // Process each land
      lands.forEach((land, index) => {
        try {
          // Skip if no geometry data
          if (!land.geojson) {
            console.warn("Land missing geojson data:", land);
            createLandListItem(land, index, allLandsList);
            return;
          }

          // Parse the GeoJSON string into an object - SIMPLER APPROACH
          let geojsonData;
          try {
            geojsonData = JSON.parse(land.geojson);
          } catch (e) {
            console.error("Failed to parse GeoJSON:", e);
            createLandListItem(land, index, allLandsList);
            return;
          }

          // Create a proper GeoJSON feature - DIRECT APPROACH
          const feature = {
            type: "Feature",
            properties: {
              id: land.land_id,
              grantor: land.grantor || "Unknown",
              grantee: land.grantee || "Unknown",
              acreage: land.acreage || "N/A",
              instrument: land.instrument || "N/A",
            },
            geometry: geojsonData,
          };

          // Professional color scheme with good contrast
          const colors = [
            "#1E88E5", // Blue
            "#D81B60", // Pink
            "#FFC107", // Amber
            "#004D40", // Teal
            "#6D4C41", // Brown
            "#5E35B1", // Deep Purple
          ];
          const color = colors[index % colors.length];

          // Add the GeoJSON to map with styling
          const geoLayer = L.geoJSON(feature, {
            style: {
              fillColor: color,
              weight: 3,
              opacity: 0.9,
              color: "#FFFFFF",
              dashArray: "5",
              fillOpacity: 0.6,
            },
            onEachFeature: (feature, layer) => {
              // Add popup with land info
              const popupContent = `
                <div class="land-popup">
                  <h3>Land #${feature.properties.id}</h3>
                  <table>
                    <tr>
                      <td><strong>Grantor:</strong></td>
                      <td>${feature.properties.grantor}</td>
                    </tr>
                    <tr>
                      <td><strong>Grantee:</strong></td>
                      <td>${feature.properties.grantee}</td>
                    </tr>
                    <tr>
                      <td><strong>Acreage:</strong></td>
                      <td>${feature.properties.acreage} acres</td>
                    </tr>
                    <tr>
                      <td><strong>Instrument:</strong></td>
                      <td>${feature.properties.instrument}</td>
                    </tr>
                  </table>
                </div>
              `;

              layer.bindPopup(popupContent);

              // Add tooltip and hover effects
              layer.bindTooltip(`Land #${feature.properties.id}`);

              layer.on({
                mouseover: (e) => {
                  const layer = e.target;
                  layer.setStyle({
                    weight: 5,
                    color: "#333",
                    dashArray: "",
                    fillOpacity: 0.8,
                  });
                  layer.bringToFront();
                },
                mouseout: (e) => {
                  geoLayer.resetStyle(e.target);
                },
                click: () => {
                  map.fitBounds(layer.getBounds(), {
                    padding: [50, 50],
                    animate: true,
                  });
                },
              });
            },
          }).addTo(map);

          // Store reference to this layer
          window.adminLandLayers = window.adminLandLayers || [];
          window.adminLandLayers.push(geoLayer);

          // Extend bounds to include this feature
          geoLayer.eachLayer((layer) => {
            if (layer.getBounds) {
              bounds.extend(layer.getBounds());
            }
          });

          // Create list item for this land
          createLandListItem(land, index, allLandsList, color);
        } catch (error) {
          console.error("Error displaying land:", error, land);
          createLandListItem(land, index, allLandsList, "#ccc");
        }
      });

      // Add event listeners to "Zoom to Land" buttons
      document.querySelectorAll(".view-land-btn").forEach((button) => {
        button.addEventListener("click", () => {
          const landId = button.getAttribute("data-land-id");
          console.log(`Zooming to land #${landId}`);

          let found = false;
          if (window.adminLandLayers && window.adminLandLayers.length > 0) {
            window.adminLandLayers.forEach((layerGroup) => {
              layerGroup.eachLayer((layer) => {
                if (layer.feature && layer.feature.properties.id == landId) {
                  map.fitBounds(layer.getBounds());
                  layer.openPopup();
                  found = true;
                }
              });
            });
          }

          if (!found) {
            console.warn(`Could not find layer for Land #${landId} to zoom to`);
          }
        });
      });

      // Fit map to show all land parcels with padding
      if (bounds.isValid()) {
        console.log("Fitting map to bounds:", bounds.toString());
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        console.warn("No valid bounds to fit map to");
        // Default to Ghana view
        map.setView([5.6037, -0.187], 10);
      }
    })
    .catch((error) => {
      console.error("Error fetching all lands:", error);
      if (loadingLands) loadingLands.style.display = "none";
      allLandsList.innerHTML = `
          <p class="error-message">
            ❌ Error loading lands: ${error.message}
            <button class="retry-button" onclick="window.location.reload()">
              Retry
            </button>
          </p>
        `;
    });
}

// Helper function for land list items (keep this part unchanged)
function createLandListItem(land, index, container, color = "#ccc") {
  if (!land || !container) return;

  const landItem = document.createElement("div");
  landItem.className = "land-item";
  landItem.style.borderLeft = `4px solid ${color}`;

  // Make sure land_id exists, fall back to index + 1 if not
  const landId = land.land_id || index + 1;

  landItem.innerHTML = `
    <div class="land-header">
      <h3>Land #${landId}</h3>
      <span class="land-status">
        ${land.acreage ? land.acreage + " acres" : "No size data"}
      </span>
    </div>
    <p class="land-details">
      <strong>Grantor:</strong> ${land.grantor || "N/A"}<br>
      <strong>Grantee:</strong> ${land.grantee || "N/A"}
    </p>
    <button class="view-land-btn" data-land-id="${landId}">
      <i class="fas fa-search-location"></i>
      Zoom to Land
    </button>
  `;

  container.appendChild(landItem);
  return landItem;
}
