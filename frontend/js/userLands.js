// Module for displaying user's lands

export function displayUserLands(walletAddress, map) {
  const myLandsContainer = document.getElementById('myLandsContainer');
  const myLandsList = document.getElementById('myLandsList');
  const loadingLands = document.getElementById('loadingLands');
  
  if (!myLandsContainer || !myLandsList) return;
  
  // Clear any existing markers
  if (window.userLandMarkers) {
    window.userLandMarkers.forEach(marker => map.removeLayer(marker));
  }
  window.userLandMarkers = [];
  
  // Use full URL to backend API server
  const apiUrl = 'http://localhost:8000/api/user-lands/' + walletAddress;
  console.log("Fetching lands from:", apiUrl);
  
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        console.error('API response error:', response.status, response.statusText);
        throw new Error(`Failed to fetch lands: ${response.status}`);
      }
      return response.json();
    })
    .then(lands => {
      // Hide loading message
      if (loadingLands) loadingLands.style.display = 'none';
      
      console.log('Received user lands:', lands);
      
      // Check if we have lands
      if (!lands || lands.length === 0) {
        myLandsList.innerHTML = '<p class="no-lands">You don\'t own any registered lands yet.</p>';
        return;
      }
      
      // Display lands in list
      myLandsList.innerHTML = '';
      
      // Create bounds to fit all land features
      const bounds = L.latLngBounds();
      
      // Clear any existing overlays
      if (window.userLandLayers) {
        window.userLandLayers.forEach(layer => map.removeLayer(layer));
      }
      window.userLandLayers = [];
      
      // Process each land
      lands.forEach((land, index) => {
        try {
          // Parse GeoJSON
          if (!land.geojson) {
            console.warn('Land missing geojson data:', land);
            return;
          }
          
          // Parse the GeoJSON string into an object
          const geojsonData = JSON.parse(land.geojson);
          
          // Create a proper GeoJSON feature
          const feature = {
            type: "Feature",
            properties: {
              id: land.land_id,
              grantor: land.grantor || 'Unknown',
              grantee: land.grantee || 'Unknown',
              acreage: land.acreage || 'N/A',
              instrument: land.instrument || 'N/A'
            },
            geometry: geojsonData
          };
          
          // Generate a unique color for this land (cycle through colors)
          const colors = ['#3388ff', '#ff4433', '#33ff44', '#ff33dd', '#ffaa33', '#33ffee'];
          const color = colors[index % colors.length];
          
          // Add the GeoJSON to map with styles
          const geoLayer = L.geoJSON(feature, {
            style: {
              fillColor: color,
              weight: 2,
              opacity: 1,
              color: 'white',
              dashArray: '3',
              fillOpacity: 0.7
            },
            onEachFeature: (feature, layer) => {
              // Add popup with land info
              layer.bindPopup(`
                <strong>Land #${feature.properties.id}</strong><br>
                <strong>Grantor:</strong> ${feature.properties.grantor}<br>
                <strong>Grantee:</strong> ${feature.properties.grantee}<br>
                <strong>Acreage:</strong> ${feature.properties.acreage} acres<br>
                <strong>Instrument:</strong> ${feature.properties.instrument}
              `);
              
              // Highlight feature on hover
              layer.on({
                mouseover: (e) => {
                  const layer = e.target;
                  layer.setStyle({
                    weight: 5,
                    color: '#666',
                    dashArray: '',
                    fillOpacity: 0.9
                  });
                  layer.bringToFront();
                },
                mouseout: (e) => {
                  geoLayer.resetStyle(e.target);
                },
                click: () => {
                  map.fitBounds(layer.getBounds());
                }
              });
            }
          }).addTo(map);
          
          // Store reference to this layer
          window.userLandLayers = window.userLandLayers || [];
          window.userLandLayers.push(geoLayer);
          
          // Extend bounds to include this feature
          geoLayer.eachLayer(layer => {
            if (layer.getBounds) {
              bounds.extend(layer.getBounds());
            }
          });
          
          // Create list item for this land
          const landItem = document.createElement('div');
          landItem.className = 'land-item';
          landItem.style.borderLeft = `4px solid ${color}`; // Match color with map
          landItem.innerHTML = `
            <div class="land-header">
              <h3>Land #${land.land_id}</h3>
              <span class="land-status">
                ${land.acreage ? land.acreage + ' acres' : 'No size data'}
              </span>
            </div>
            <p class="land-details">
              <strong>Grantor:</strong> ${land.grantor || 'N/A'}<br>
              <strong>Grantee:</strong> ${land.grantee || 'N/A'}
            </p>
            <button class="view-land-btn" data-land-id="${land.land_id}">
              Zoom to Land
            </button>
          `;
          
          myLandsList.appendChild(landItem);
          
        } catch (error) {
          console.error('Error displaying land:', error, land);
        }
      });
      
      // Add event listeners to "Zoom to Land" buttons
      document.querySelectorAll('.view-land-btn').forEach(button => {
        button.addEventListener('click', () => {
          const landId = button.getAttribute('data-land-id');
          
          // Find the corresponding GeoJSON layer and zoom to it
          window.userLandLayers.forEach(layerGroup => {
            layerGroup.eachLayer(layer => {
              if (layer.feature && layer.feature.properties.id == landId) {
                map.fitBounds(layer.getBounds());
                layer.openPopup();
              }
            });
          });
        });
      });
      
      // Fit map to show all land parcels with padding
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    })
    .catch(error => {
      console.error('Error fetching user lands:', error);
      if (loadingLands) loadingLands.style.display = 'none';
      myLandsList.innerHTML = `<p class="error-message">❌ Error loading your lands: ${error.message}</p>`;
    });
}