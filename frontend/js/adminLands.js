// Function to display all registered lands on admin dashboard
export function displayAllLands(map) {
    const allLandsContainer = document.getElementById('allLandsContainer');
    const allLandsList = document.getElementById('allLandsList');
    const loadingLands = document.getElementById('loadingLands');
    
    if (!allLandsContainer || !allLandsList) return;
    
    // Clear any existing markers
    if (window.adminLandLayers) {
      window.adminLandLayers.forEach(layer => map.removeLayer(layer));
    }
    window.adminLandLayers = [];
    
    // Fetch all lands
    fetch('http://localhost:8000/api/all-lands')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch lands: ${response.status}`);
        }
        return response.json();
      })
      .then(lands => {
        // Hide loading message
        if (loadingLands) loadingLands.style.display = 'none';
        
        console.log('Received all lands:', lands);
        
        // Check if we have lands
        if (!lands || lands.length === 0) {
          allLandsList.innerHTML = '<p class="no-lands">No registered lands found.</p>';
          return;
        }
        
        // Display lands in list
        allLandsList.innerHTML = '';
        
        // Create bounds to fit all land features
        const bounds = L.latLngBounds();
        
        // Process each land
        lands.forEach((land, index) => {
          try {
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
            
            // Professional color scheme with good contrast
            const colors = [
              '#1E88E5', // Blue
              '#D81B60', // Pink
              '#FFC107', // Amber
              '#004D40', // Teal
              '#6D4C41', // Brown
              '#5E35B1'  // Deep Purple
            ];
            const color = colors[index % colors.length];
            
            // Add the GeoJSON to map with styling
            const geoLayer = L.geoJSON(feature, {
              style: {
                fillColor: color,
                weight: 3,
                opacity: 0.9,
                color: '#FFFFFF',
                dashArray: '5',
                fillOpacity: 0.6
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
                      color: '#333',
                      dashArray: '',
                      fillOpacity: 0.8
                    });
                    layer.bringToFront();
                  },
                  mouseout: (e) => {
                    geoLayer.resetStyle(e.target);
                  },
                  click: () => {
                    map.fitBounds(layer.getBounds(), {
                      padding: [50, 50],
                      animate: true
                    });
                  }
                });
              }
            }).addTo(map);
            
            // Store reference to this layer
            window.adminLandLayers = window.adminLandLayers || [];
            window.adminLandLayers.push(geoLayer);
            
            // Extend bounds to include this feature
            geoLayer.eachLayer(layer => {
              if (layer.getBounds) {
                bounds.extend(layer.getBounds());
              }
            });
            
            // Create list item for this land
            const landItem = document.createElement('div');
            landItem.className = 'land-item';
            landItem.style.borderLeft = `4px solid ${color}`;
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
            
            allLandsList.appendChild(landItem);
            
          } catch (error) {
            console.error('Error displaying land:', error, land);
          }
        });
        
        // Add event listeners to "Zoom to Land" buttons
        document.querySelectorAll('.view-land-btn').forEach(button => {
          button.addEventListener('click', () => {
            const landId = button.getAttribute('data-land-id');
            
            window.adminLandLayers.forEach(layerGroup => {
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
        console.error('Error fetching all lands:', error);
        if (loadingLands) loadingLands.style.display = 'none';
        allLandsList.innerHTML = `<p class="error-message">❌ Error loading lands: ${error.message}</p>`;
      });
  }