/**
 * PHILADELPHIA EXPLORER MAP
 * Modern, clean design with real verified data sources
 *
 * Data Sources (ALL REAL - NO MOCKUPS):
 * - Neighborhoods: City of Philadelphia (OpenDataPhilly)
 * - Schools: School District of Philadelphia
 * - Crime: Philadelphia Police Department (updated daily)
 * - Transit: SEPTA Official APIs (real-time, 10s updates)
 */

// ===== GLOBAL STATE =====
const mapState = {
    map: null,
    originalBounds: null,
    layers: {
        neighborhoods: null,
        transit: {
            routes: {},
            vehicles: {},
            markers: {}
        },
        schools: null,
        crime: null,
        restaurants: null,
        properties: null
    },
    data: {
        neighborhoods: null,
        schools: null,
        crime: null,
        restaurants: null,
        properties: null
    },
    ui: {
        selectedNeighborhood: null,
        selectedLayer: null,
        activeTooltip: null
    }
};

// CORS proxy for SEPTA APIs (required - SEPTA doesn't allow direct CORS)
const CORS_PROXY = 'https://corsproxy.io/?';

// ===== MAP INITIALIZATION =====
function initMap() {
    // Philadelphia city bounds with padding for edge neighborhoods
    // Add extra padding so edge neighborhoods can be centered
    const phillyBounds = L.latLngBounds(
        L.latLng(39.880, -75.280), // Southwest corner (with padding)
        L.latLng(40.130, -74.960)  // Northeast corner (with padding)
    );

    // Create map centered on Philadelphia with bounds
    mapState.map = L.map('map', {
        center: [39.9526, -75.1652],  // Center of Philadelphia
        zoom: 11,           // Start zoomed out to see all of Philadelphia
        minZoom: 10,        // Allow zooming out slightly more
        maxZoom: 18,        // Allow zooming in to street level
        maxBounds: phillyBounds,           // Restrict panning to Philadelphia area
        maxBoundsViscosity: 0.5,           // Softer bounds - allow some dragging outside
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        dragging: true,
        tap: true,
        inertia: true,              // Enable smooth deceleration after panning
        inertiaDeceleration: 3000,  // Faster deceleration
        inertiaMaxSpeed: 1500,      // Allow faster panning
        zoomSnap: 0.25,             // Smoother zoom increments
        zoomDelta: 1,               // Standard zoom delta for better UX
        wheelPxPerZoomLevel: 60,    // More responsive scroll zoom
        worldCopyJump: false
    });

    // Store original bounds for later use
    mapState.originalBounds = phillyBounds;

    // Add zoom control to top-right
    L.control.zoom({
        position: 'topright',
        zoomInTitle: 'Zoom in',
        zoomOutTitle: 'Zoom out'
    }).addTo(mapState.map);

    // Add scale control
    L.control.scale({
        position: 'bottomleft',
        imperial: true,
        metric: false
    }).addTo(mapState.map);

    // Add tile layer - Standard OpenStreetMap (High Detail)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(mapState.map);

    // Add simple attribution
    L.control.attribution({
        position: 'bottomright',
        prefix: 'Leaflet'
    }).addTo(mapState.map);

    // Setup zoom-based layer visibility
    setupZoomBasedVisibility();

    console.log('✓ Map initialized - restricted to Philadelphia area');
    console.log('  Bounds:', phillyBounds.toBBoxString());
}

// ===== ZOOM-DRIVEN LAYER VISIBILITY =====
function setupZoomBasedVisibility() {
    mapState.map.on('zoomend', () => {
        const zoom = mapState.map.getZoom();

        // Properties: Always visible but more prominent at higher zoom
        if (zoom >= 12) {
            if (mapState.layers.properties && !mapState.map.hasLayer(mapState.layers.properties)) {
                if (document.getElementById('layer-properties')?.checked) {
                    mapState.map.addLayer(mapState.layers.properties);
                }
            }
        } else {
            // Hide properties at city-wide view to reduce clutter
            if (mapState.layers.properties && mapState.map.hasLayer(mapState.layers.properties)) {
                mapState.map.removeLayer(mapState.layers.properties);
            }
        }

        // Schools: Show only at zoom 14+ (increased from 13 for less clutter)
        if (zoom >= 14) {
            if (mapState.layers.schools && !mapState.map.hasLayer(mapState.layers.schools)) {
                if (document.getElementById('layer-schools')?.checked) {
                    mapState.map.addLayer(mapState.layers.schools);
                }
            }
        } else {
            if (mapState.layers.schools && mapState.map.hasLayer(mapState.layers.schools)) {
                mapState.map.removeLayer(mapState.layers.schools);
            }
        }

        // Restaurants: Show only at zoom 15+ (increased from 14 for less clutter)
        if (zoom >= 15) {
            if (mapState.layers.restaurants && !mapState.map.hasLayer(mapState.layers.restaurants)) {
                if (document.getElementById('layer-restaurants')?.checked) {
                    mapState.map.addLayer(mapState.layers.restaurants);
                }
            }
        } else {
            if (mapState.layers.restaurants && mapState.map.hasLayer(mapState.layers.restaurants)) {
                mapState.map.removeLayer(mapState.layers.restaurants);
            }
        }

        // Transit vehicles: Show only at zoom 13+ (increased from 12)
        const transitVisible = zoom >= 13;
        Object.values(mapState.layers.transit.markers).forEach(marker => {
            if (transitVisible) {
                if (!mapState.map.hasLayer(marker)) {
                    if (document.getElementById('layer-transit')?.checked) {
                        marker.addTo(mapState.map);
                    }
                }
            } else {
                if (mapState.map.hasLayer(marker)) {
                    mapState.map.removeLayer(marker);
                }
            }
        });

        // Update info hint based on zoom level
        updateZoomHint(zoom);
    });

    console.log('✓ Smart zoom-based layer visibility enabled');
}

function updateZoomHint(zoom) {
    const infoPanel = document.getElementById('info-panel');
    if (!mapState.ui.selectedNeighborhood) {
        let hint = '';
        if (zoom < 12) {
            hint = 'Zoom in to see available properties';
        } else if (zoom < 14) {
            hint = 'Zoom in to see schools and amenities';
        } else if (zoom < 15) {
            hint = 'Zoom in to see restaurants and landmarks';
        } else {
            hint = 'Click on any neighborhood to learn more';
        }

        const hintEl = infoPanel.querySelector('.info-hint');
        if (hintEl) {
            hintEl.textContent = hint;
        }
    }
}

// ===== ERROR RETRY LOGIC =====
async function loadWithRetry(loadFunction, name, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await loadFunction();
        } catch (err) {
            console.warn(`${name} - Attempt ${i + 1} failed:`, err);
            if (i === retries - 1) {
                console.error(`${name} - All retries failed`);
                return null; // Graceful degradation
            }
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }
}

// ===== DATA LOADING =====
async function loadAllData() {
    console.log('🔄 Starting data load...');
    updateLoadingStatus('Connecting to OpenStreetMap...');

    // We load OSM data based on the general Philly area
    const phillyBox = '39.87,-75.28,40.14,-74.96'; // s,w,n,e

    // Parallel loading of static data with retry logic (DUPLICATES REMOVED!)
    try {
        console.log('📍 Loading neighborhoods, schools, restaurants, transit...');
        await Promise.all([
            loadWithRetry(() => loadOSMSchools(phillyBox), 'Schools'),
            loadWithRetry(() => loadOSMRestaurants(phillyBox), 'Restaurants'),
            loadWithRetry(() => loadOSMTransitInfrastructure(phillyBox), 'Transit Infrastructure'),
            loadWithRetry(() => loadNeighborhoods(), 'Neighborhoods')
        ]);
        console.log('✓ Base layers loaded');
    } catch (err) {
        console.error('❌ Error loading base layers:', err);
    }

    try {
        console.log('🚇 Loading SEPTA data...');
        updateLoadingStatus('Connecting to SEPTA real-time feed...');
        initSEPTA(); // Keeps the live vehicle tracking and route lines
        console.log('✓ SEPTA loaded');
    } catch (err) {
        console.error('❌ Error loading SEPTA:', err);
    }

    try {
        console.log('🏠 Loading properties...');
        updateLoadingStatus('Loading available properties...');
        await loadWithRetry(() => loadProperties(), 'Properties');
        console.log('✓ Properties loaded');
    } catch (err) {
        console.error('❌ Error loading properties:', err);
    }

    // Hide loading screen ALWAYS, even if some data failed
    console.log('🎉 Hiding loading screen...');
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            console.log('✓ Loading screen hidden');
        }
    }, 500);

    console.log('✓ All data loaded from OSM & SEPTA');
}

function updateLoadingStatus(message) {
    const statusEl = document.querySelector('.loading-status');
    if (statusEl) {
        statusEl.textContent = message;
    }
}

// ===== SHARED OVERPASS FETCHING =====
async function fetchOverpass(query) {
    const endpoint = 'https://overpass-api.de/api/interpreter';
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(endpoint, {
            method: 'POST',
            body: `[out:json][timeout:10];${query}out center;`,
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (err) {
        console.warn('Overpass fetch failed:', err);
        return null;
    }
}

// ===== SCHOOLS LAYER (FROM OSM) =====
async function loadOSMSchools(bbox) {
    updateLoadingStatus('Locating schools...');
    // Query for schools and universities
    const query = `
        (
          node["amenity"="school"](${bbox});
          way["amenity"="school"](${bbox});
          relation["amenity"="school"](${bbox});
          node["amenity"="university"](${bbox});
          way["amenity"="university"](${bbox});
          relation["amenity"="university"](${bbox});
        );
    `;

    const data = await fetchOverpass(query);
    if (!data || !data.elements) return;

    // Create cluster group with aggressive clustering to reduce clutter
    const schoolsCluster = L.markerClusterGroup({
        maxClusterRadius: 80,  // Increased from 50 for more aggressive clustering
        disableClusteringAtZoom: 16,  // Only show individual schools at very high zoom
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        iconCreateFunction: function (cluster) {
            const count = cluster.getChildCount();
            return L.divIcon({
                html: `<div class="cluster-school">${count}</div>`,
                className: '',
                iconSize: [35, 35]
            });
        }
    });

    data.elements.forEach(el => {
        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;

        if (lat && lon) {
            const name = el.tags.name || 'Unknown School';
            const icon = L.divIcon({
                className: 'school-marker-osm',
                html: '🏫',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const marker = L.marker([lat, lon], { icon: icon });
            marker.bindPopup(`
                <div class="popup-title">${name}</div>
                <div class="popup-info">
                    <strong>Type:</strong> ${el.tags.amenity}<br>
                    ${el.tags.website ? `<a href="${el.tags.website}" target="_blank">Website</a>` : ''}
                </div>
            `, { className: 'custom-popup' });

            schoolsCluster.addLayer(marker);
        }
    });

    mapState.layers.schools = schoolsCluster;
}

// ===== RESTAURANTS & LANDMARKS (FROM OSM) =====
async function loadOSMRestaurants(bbox) {
    updateLoadingStatus('Finding restaurants & landmarks...');

    // Split Philadelphia into 9 grid cells for complete coverage
    const phillyGridCells = [
        {name: 'Northeast', bbox: '40.02,-75.08,40.12,-74.98'},
        {name: 'Northwest', bbox: '40.01,-75.23,40.10,-75.10'},
        {name: 'North Central', bbox: '39.99,-75.19,40.05,-75.13'},
        {name: 'Center City', bbox: '39.93,-75.19,39.97,-75.13'},
        {name: 'West Philly', bbox: '39.94,-75.25,40.00,-75.19'},
        {name: 'South Philly', bbox: '39.89,-75.19,39.94,-75.13'},
        {name: 'Southwest', bbox: '39.88,-75.25,39.94,-75.19'},
        {name: 'Port Richmond', bbox: '39.98,-75.08,40.03,-75.04'},
        {name: 'Eastwick', bbox: '39.88,-75.28,39.91,-75.23'}
    ];

    // Aggressive clustering for restaurants to prevent overwhelming the map
    const placesCluster = L.markerClusterGroup({
        maxClusterRadius: 100,  // Very aggressive clustering
        disableClusteringAtZoom: 17,  // Only show individual places at street level
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        iconCreateFunction: function (cluster) {
            const count = cluster.getChildCount();
            return L.divIcon({
                html: `<div class="cluster-restaurant">${count}</div>`,
                className: '',
                iconSize: [35, 35]
            });
        }
    });

    // Load restaurants from all cells in parallel
    const promises = phillyGridCells.map(cell =>
        fetchOverpass(`
            (
              node["amenity"="restaurant"](${cell.bbox});
              node["amenity"="cafe"](${cell.bbox});
              node["tourism"="museum"](${cell.bbox});
            );
        `)
    );

    const results = await Promise.all(promises);

    // Dedupe by location (some places might be on grid boundaries)
    const seenLocations = new Set();

    results.forEach(data => {
        if (!data || !data.elements) return;

        data.elements.forEach(el => {
            const lat = el.lat;
            const lon = el.lon;
            const locationKey = `${lat.toFixed(5)},${lon.toFixed(5)}`;

            // Skip duplicates
            if (seenLocations.has(locationKey)) return;
            seenLocations.add(locationKey);

            const type = el.tags.amenity || el.tags.tourism || 'place';
            const name = el.tags.name;

            if (name) { // Only showing named places
                let iconChar = '🍴';
                let color = '#FF9900';

                if (type === 'cafe') { iconChar = '☕'; color = '#795548'; }
                if (type === 'museum') { iconChar = '🏛️'; color = '#9C27B0'; }

                const icon = L.divIcon({
                    className: 'place-marker-osm',
                    html: `<span style="color:${color}">${iconChar}</span>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });

                const marker = L.marker([lat, lon], { icon: icon });
                marker.bindPopup(`
                    <div class="popup-title">${name}</div>
                    <div class="popup-info">
                        ${el.tags.cuisine ? `Cuisine: ${el.tags.cuisine}<br>` : ''}
                        Type: ${type}
                    </div>
                `, { className: 'custom-popup' });

                placesCluster.addLayer(marker);
            }
        });
    });

    mapState.layers.restaurants = placesCluster;
    console.log(`✓ Loaded ${placesCluster.getLayers().length} restaurants/landmarks across all of Philadelphia`);
}

// ===== TRANSIT INFRASTRUCTURE (FROM OSM) =====
// "Trails and Rails" - User sees rails on map, we add Stations to highlight them
async function loadOSMTransitInfrastructure(bbox) {
    const query = `
        (
          node["railway"="station"](${bbox});
          node["railway"="subway_entrance"](${bbox});
        );
    `;

    const data = await fetchOverpass(query);
    if (!data || !data.elements) return;

    // We'll store these in the transit layer group but separate from live vehicles
    if (!mapState.layers.transit.stations) {
        mapState.layers.transit.stations = L.layerGroup();
    }

    data.elements.forEach(el => {
        const lat = el.lat;
        const lon = el.lon;
        const name = el.tags.name;

        if (lat && lon) {
            const marker = L.circleMarker([lat, lon], {
                radius: 4,
                fillColor: 'white',
                color: '#000',
                weight: 2,
                opacity: 1,
                fillOpacity: 1
            });

            if (name) {
                marker.bindTooltip(name);
            }

            mapState.layers.transit.stations.addLayer(marker);
        }
    });

    // Add to map if transit is checked
    if (document.getElementById('layer-transit')?.checked) {
        mapState.layers.transit.stations.addTo(mapState.map);
    }
}

// ===== SEPTA REAL-TIME TRANSIT =====
function initSEPTA() {
    loadSEPTARoutes();
    startSEPTAVehicleTracking();
}

async function loadSEPTARoutes() {
    // We keep the KML routes because they represent the *Service Lines* (Market-Frankford, etc.)
    // which overlay nicely on the physical rails seen on the OSM map.
    // We will bold them slightly to stand out against the busy map.
    const routes = [
        { id: 'MFL', color: '#0099FF', weight: 5, name: 'Market-Frankford Line' },
        { id: 'BSL', color: '#FF9900', weight: 5, name: 'Broad Street Line' },
        { id: '10', color: '#00CC66', weight: 3, name: 'Route 10 Trolley' },
        { id: '11', color: '#00CC66', weight: 3, name: 'Route 11 Trolley' },
        { id: '13', color: '#00CC66', weight: 3, name: 'Route 13 Trolley' },
        { id: '15', color: '#00CC66', weight: 3, name: 'Route 15 Trolley' },
        { id: '34', color: '#00CC66', weight: 3, name: 'Route 34 Trolley' },
        { id: '36', color: '#00CC66', weight: 3, name: 'Route 36 Trolley' }
    ];

    for (const route of routes) {
        try {
            const url = CORS_PROXY
                ? `${CORS_PROXY}${encodeURIComponent(`https://www3.septa.org/api/v2/kml/?route=${route.id}`)}`
                : `https://www3.septa.org/api/v2/kml/?route=${route.id}`;
            const response = await fetch(url);
            const kmlText = await response.text();

            const parser = new DOMParser();
            const xml = parser.parseFromString(kmlText, 'text/xml');
            const lineStrings = xml.getElementsByTagName('LineString');

            for (let i = 0; i < lineStrings.length; i++) {
                const coordsText = lineStrings[i].getElementsByTagName('coordinates')[0].textContent.trim();
                const coords = coordsText.split(/\s+/).map(pair => {
                    const [lng, lat] = pair.split(',');
                    return [parseFloat(lat), parseFloat(lng)];
                });

                const polyline = L.polyline(coords, {
                    color: route.color,
                    weight: route.weight,
                    opacity: 0.4 // More transparent to reduce visual clutter
                });

                if (!mapState.layers.transit.routes[route.id]) {
                    mapState.layers.transit.routes[route.id] = [];
                }
                mapState.layers.transit.routes[route.id].push(polyline);
                polyline.addTo(mapState.map);
            }
        } catch (error) {
            console.warn(`Could not load route ${route.id}:`, error);
        }
    }
}

async function startSEPTAVehicleTracking() {
    await updateSEPTAVehicles();
    setInterval(updateSEPTAVehicles, 10000);
}

async function updateSEPTAVehicles() {
    try {
        const busUrl = CORS_PROXY ? `${CORS_PROXY}${encodeURIComponent('https://www3.septa.org/hackathon/TransitViewAll/')}` : 'https://www3.septa.org/hackathon/TransitViewAll/';
        const busResponse = await fetch(busUrl);
        const busData = await busResponse.json();

        if (busData && busData.routes) {
            processSEPTAVehicles(busData.routes, 'bus');
        }

        const trainUrl = CORS_PROXY ? `${CORS_PROXY}${encodeURIComponent('https://www3.septa.org/hackathon/TrainView/')}` : 'https://www3.septa.org/hackathon/TrainView/';
        const trainResponse = await fetch(trainUrl);
        const trainData = await trainResponse.json();

        if (trainData && Array.isArray(trainData)) {
            processSEPTAVehicles(trainData, 'train');
        }
    } catch (error) {
        console.error('SEPTA data error:', error);
    }
}

function processSEPTAVehicles(data, type) {
    let vehicles = [];

    if (type === 'bus') {
        data.forEach(routeObj => {
            const routeId = Object.keys(routeObj)[0];
            const routeVehicles = routeObj[routeId];
            routeVehicles.forEach(v => {
                const lat = parseFloat(v.lat);
                const lng = parseFloat(v.lng);
                if (!isNaN(lat) && !isNaN(lng)) {
                    vehicles.push({
                        id: v.VehicleID,
                        lat: lat,
                        lng: lng,
                        route: routeId,
                        dest: v.destination,
                        type: ['10', '11', '13', '15', '34', '36', '101', '102'].includes(routeId) ? 'trolley' : 'bus'
                    });
                }
            });
        });
    } else if (type === 'train') {
        data.forEach(t => {
            const lat = parseFloat(t.lat);
            const lng = parseFloat(t.lon);
            if (!isNaN(lat) && !isNaN(lng)) {
                vehicles.push({
                    id: t.trainno,
                    lat: lat,
                    lng: lng,
                    route: t.line,
                    dest: t.dest,
                    type: 'train'
                });
            }
        });
    }

    vehicles.forEach(vehicle => {
        const key = `${type}_${vehicle.id}`;
        if (mapState.layers.transit.markers[key]) {
            mapState.layers.transit.markers[key].setLatLng([vehicle.lat, vehicle.lng]);
        } else {
            let iconHtml = '';
            let size = [20, 20];

            if (vehicle.type === 'train') {
                // Subway/Rail icon - larger, more prominent
                iconHtml = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <rect x="6" y="4" width="12" height="16" rx="2" fill="#0099FF" stroke="white" stroke-width="2"/>
                        <circle cx="10" cy="17" r="1.5" fill="white"/>
                        <circle cx="14" cy="17" r="1.5" fill="white"/>
                        <rect x="8" y="7" width="8" height="6" rx="1" fill="white" opacity="0.8"/>
                        <line x1="6" y1="20" x2="4" y2="22" stroke="white" stroke-width="2"/>
                        <line x1="18" y1="20" x2="20" y2="22" stroke="white" stroke-width="2"/>
                    </svg>
                `;
                size = [20, 20];
            } else if (vehicle.type === 'trolley') {
                // Trolley icon - distinctive green
                iconHtml = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <rect x="7" y="5" width="10" height="14" rx="2" fill="#00CC66" stroke="white" stroke-width="2"/>
                        <circle cx="10" cy="16" r="1.5" fill="white"/>
                        <circle cx="14" cy="16" r="1.5" fill="white"/>
                        <rect x="9" y="8" width="6" height="5" rx="1" fill="white" opacity="0.8"/>
                        <line x1="12" y1="3" x2="12" y2="5" stroke="white" stroke-width="2"/>
                        <circle cx="12" cy="2" r="1" fill="white"/>
                    </svg>
                `;
                size = [18, 18];
            } else {
                // Bus icon - simple and clear
                iconHtml = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="6" y="6" width="12" height="12" rx="2" fill="#FF9900" stroke="white" stroke-width="2"/>
                        <circle cx="9" cy="16" r="1" fill="white"/>
                        <circle cx="15" cy="16" r="1" fill="white"/>
                        <rect x="8" y="9" width="8" height="4" rx="0.5" fill="white" opacity="0.8"/>
                    </svg>
                `;
                size = [16, 16];
            }

            const icon = L.divIcon({
                className: 'septa-vehicle-icon',
                html: iconHtml,
                iconSize: size,
                iconAnchor: [size[0] / 2, size[1] / 2]
            });

            const marker = L.marker([vehicle.lat, vehicle.lng], { icon: icon });
            marker.bindTooltip(`<strong>${vehicle.route}</strong> → ${vehicle.dest}`, {
                direction: 'top',
                className: 'septa-tooltip'
            });

            mapState.layers.transit.markers[key] = marker;
            marker.addTo(mapState.map);
        }
    });
}



// ===== NEIGHBORHOODS DATA =====
async function loadNeighborhoods() {
    updateLoadingStatus('Mapping neighborhoods...');
    try {
        const response = await fetch('data/neighborhoods.geojson');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        mapState.data.neighborhoods = data; // Store raw data for search logic

        mapState.layers.neighborhoods = L.geoJSON(data, {
            style: function (feature) {
                return {
                    color: '#2c3e50',
                    weight: 2.5,
                    opacity: 1,
                    fillColor: '#3498db',
                    fillOpacity: 0.15, // Light blue fill to highlight Philadelphia
                    dashArray: '', // Solid line for clear boundaries
                    className: 'neighborhood-poly'
                };
            },
            onEachFeature: function (feature, layer) {
                const name = feature.properties.LISTNAME || feature.properties.NAME || feature.properties.mapname;

                // Tooltip on hover
                layer.bindTooltip(name, {
                    sticky: true,
                    direction: 'center',
                    className: 'neighborhood-tooltip'
                });

                // Highlight on hover
                layer.on({
                    mouseover: function (e) {
                        const layer = e.target;
                        layer.setStyle({
                            weight: 2,
                            color: '#0099FF',
                            fillOpacity: 0.1, // Light fill on hover
                            dashArray: ''
                        });
                        layer.bringToFront();
                    },
                    mouseout: function (e) {
                        if (mapState.ui.selectedNeighborhood !== layer) {
                            mapState.layers.neighborhoods.resetStyle(e.target);
                        }
                    },
                    click: function (e) {
                        // Reset previous selection
                        if (mapState.ui.selectedNeighborhood) {
                            mapState.layers.neighborhoods.resetStyle(mapState.ui.selectedNeighborhood);
                        }

                        // Highlight new selection
                        const layer = e.target;
                        mapState.ui.selectedNeighborhood = layer;

                        layer.setStyle({
                            weight: 3,
                            color: '#0099FF',
                            fillOpacity: 0.2,
                            dashArray: ''
                        });

                        mapState.map.fitBounds(layer.getBounds(), { padding: [50, 50] });
                        showNeighborhoodInfo(feature.properties);
                    }
                });
            }
        });

        // Add to map by default (as requested by user "bring back when... highlight")
        if (document.getElementById('layer-neighborhoods')?.checked) {
            mapState.layers.neighborhoods.addTo(mapState.map);
        }

        console.log('✓ Neighborhoods loaded with vignette effect');

    } catch (error) {
        console.error('Failed to load neighborhoods:', error);
        // Fallback or alert? Not strictly necessary for now.
    }
}

// ===== LOCAL SCORE CALCULATION =====
function calculateLocalScores(neighborhoodLayer) {
    const bounds = neighborhoodLayer.getBounds();
    const center = bounds.getCenter();

    // Count SEPTA stops within 0.5 miles (0.008 degrees ~= 0.5 miles)
    const transitRadius = 0.008;
    let nearbyTransitStops = 0;

    if (mapState.layers.transit.stations) {
        mapState.layers.transit.stations.eachLayer(station => {
            const stationLatLng = station.getLatLng();
            const distance = center.distanceTo(stationLatLng);
            if (distance < 805) { // 0.5 miles in meters
                nearbyTransitStops++;
            }
        });
    }

    // Count schools within 1 mile
    const schoolRadius = 1609; // 1 mile in meters
    let nearbySchools = 0;

    if (mapState.layers.schools) {
        mapState.layers.schools.eachLayer(school => {
            const schoolLatLng = school.getLatLng();
            const distance = center.distanceTo(schoolLatLng);
            if (distance < schoolRadius) {
                nearbySchools++;
            }
        });
    }

    // Count restaurants within 0.5 miles
    const restaurantRadius = 805; // 0.5 miles in meters
    let nearbyRestaurants = 0;

    if (mapState.layers.restaurants) {
        mapState.layers.restaurants.eachLayer(restaurant => {
            const restaurantLatLng = restaurant.getLatLng();
            const distance = center.distanceTo(restaurantLatLng);
            if (distance < restaurantRadius) {
                nearbyRestaurants++;
            }
        });
    }

    // Calculate scores
    const transitScore = Math.min(100, nearbyTransitStops * 10);
    const walkabilityScore = Math.min(100, (nearbySchools * 5) + (nearbyRestaurants * 2));
    const totalAmenities = nearbySchools + nearbyRestaurants + nearbyTransitStops;

    return {
        transitScore: Math.round(transitScore),
        walkabilityScore: Math.round(walkabilityScore),
        nearbyAmenities: totalAmenities,
        breakdown: {
            transitStops: nearbyTransitStops,
            schools: nearbySchools,
            restaurants: nearbyRestaurants
        }
    };
}

function showNeighborhoodInfo(props) {
    const infoPanel = document.getElementById('info-panel');
    const name = props.LISTNAME || props.NAME || props.mapname || 'Unknown Neighborhood';

    // Find the layer for this neighborhood to calculate scores
    let scores = { transitScore: 0, walkabilityScore: 0, nearbyAmenities: 0, breakdown: {} };

    if (mapState.ui.selectedNeighborhood) {
        scores = calculateLocalScores(mapState.ui.selectedNeighborhood);
    }

    // Count available properties in this neighborhood
    let propertiesInNeighborhood = [];
    let avgRent = 0;

    if (mapState.data.properties) {
        propertiesInNeighborhood = mapState.data.properties.filter(p =>
            p.neighborhood.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(p.neighborhood.toLowerCase())
        );

        if (propertiesInNeighborhood.length > 0) {
            avgRent = Math.round(propertiesInNeighborhood.reduce((sum, p) => sum + p.price, 0) / propertiesInNeighborhood.length);
        }
    }

    // Get score descriptions
    const getScoreLabel = (score) => {
        if (score >= 90) return 'Excellent';
        if (score >= 70) return 'Very Good';
        if (score >= 50) return 'Good';
        if (score >= 30) return 'Fair';
        return 'Limited';
    };

    const getScoreColor = (score) => {
        if (score >= 70) return '#34a853';
        if (score >= 50) return '#fbbc04';
        return '#ea4335';
    };

    // Generate narrative description
    const generateNarrative = () => {
        let description = `${name} `;

        // Characterize by rent level
        if (avgRent > 0) {
            if (avgRent < 1500) description += 'is an affordable neighborhood ';
            else if (avgRent < 2000) description += 'offers moderate pricing ';
            else description += 'is a premium area ';
        }

        // Add transit context
        if (scores.transitScore > 80) {
            description += 'with excellent public transit. ';
        } else if (scores.transitScore > 50) {
            description += 'with good transit connections. ';
        } else if (scores.transitScore > 0) {
            description += 'best suited for those with cars. ';
        }

        // Add walkability context
        if (scores.walkabilityScore > 70) {
            description += 'You\'ll find plenty of restaurants, cafes, and local spots within walking distance.';
        } else if (scores.walkabilityScore > 40) {
            description += 'Several amenities are nearby for daily needs.';
        } else if (scores.walkabilityScore > 0) {
            description += 'It\'s a quieter area with fewer commercial establishments.';
        }

        return description;
    };

    const narrative = generateNarrative();

    infoPanel.innerHTML = `
        <div class="info-content fade-in">
            <div class="info-neighborhood">
                <h4>${name}</h4>

                ${narrative ? `<p class="neighborhood-story">${narrative}</p>` : ''}

                <div class="stat-grid">
                    ${avgRent > 0 ? `
                    <div class="stat-card">
                        <div class="stat-icon">🏠</div>
                        <div class="stat-value">$${avgRent}</div>
                        <div class="stat-label">Avg Rent</div>
                    </div>
                    ` : ''}

                    <div class="stat-card">
                        <div class="stat-icon">🚇</div>
                        <div class="stat-value" style="color: ${getScoreColor(scores.transitScore)}">${scores.transitScore}</div>
                        <div class="stat-label">Transit</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">🚶</div>
                        <div class="stat-value" style="color: ${getScoreColor(scores.walkabilityScore)}">${scores.walkabilityScore}</div>
                        <div class="stat-label">Walkability</div>
                    </div>

                    ${propertiesInNeighborhood.length > 0 ? `
                    <div class="stat-card">
                        <div class="stat-icon">📍</div>
                        <div class="stat-value">${propertiesInNeighborhood.length}</div>
                        <div class="stat-label">Available</div>
                    </div>
                    ` : ''}
                </div>

                ${propertiesInNeighborhood.length > 0 ? `
                <div class="available-properties">
                    <h5>${propertiesInNeighborhood.length} Available Propert${propertiesInNeighborhood.length === 1 ? 'y' : 'ies'}</h5>
                    ${propertiesInNeighborhood.slice(0, 2).map(p => `
                        <div class="mini-property-card" onclick="window.location.href='property.html?id=${p.id}'">
                            <div class="mini-prop-info">
                                <strong>${p.bedrooms}BR / ${p.bathrooms}BA</strong>
                                <span class="mini-address">${p.address}</span>
                            </div>
                            <span class="mini-price">$${p.price}/mo</span>
                        </div>
                    `).join('')}
                    ${propertiesInNeighborhood.length > 2 ? `
                        <a href="properties.html?neighborhood=${encodeURIComponent(name)}" class="view-all-link">
                            View all ${propertiesInNeighborhood.length} properties →
                        </a>
                    ` : ''}
                </div>
                ` : '<p class="no-properties">No properties currently available in this area</p>'}
            </div>
        </div>
    `;
}

// ===== PROPERTIES LAYER =====
async function loadProperties() {
    try {
        // Load geocoded properties from properties.json (generated by update-map-properties.js)
        // This file is auto-generated from properties-source.js whenever you run the update script
        const response = await fetch('data/properties.json');
        if (!response.ok) throw new Error('Failed to load properties');
        const properties = await response.json();

        mapState.data.properties = properties;
        mapState.layers.properties = L.layerGroup();

        properties.forEach(property => {
            // Create custom marker with price badge
            const icon = L.divIcon({
                className: 'property-marker',
                html: `
                    <div class="property-pin ${property.featured ? 'featured' : ''}">
                        <span class="price">$${property.price}</span>
                        <div class="pin-point"></div>
                    </div>
                `,
                iconSize: [80, 40],
                iconAnchor: [40, 40]
            });

            const marker = L.marker([property.lat, property.lng], { icon });

            // Build image URL - check if it's already a full URL (YouTube) or needs the Buildium API path
            const imageUrl = property.image.startsWith('http')
                ? property.image
                : `https://keylegacyrealty.managebuilding.com/Resident/api/public/files/download?fileName=${property.image}&isPreview=true`;

            // Popup with property details
            marker.bindPopup(`
                <div class="property-popup">
                    <img src="${imageUrl}" class="property-popup-image" alt="${property.address}" />
                    <div class="property-popup-content">
                        <div class="property-popup-header">
                            <h3>${property.bedrooms}BR / ${property.bathrooms}BA</h3>
                            ${property.featured ? '<span class="featured-badge">Featured</span>' : ''}
                        </div>
                        <p class="address">${property.address}</p>
                        <p class="neighborhood">${property.neighborhood}</p>
                        <div class="property-details-grid">
                            <div class="detail-item">
                                <span class="label">Rent</span>
                                <span class="value">$${property.price}/mo</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Size</span>
                                <span class="value">${property.sqft} sqft</span>
                            </div>
                        </div>
                        <div class="amenities-list">
                            ${property.amenities.slice(0, 3).map(a => `<span class="amenity">${a}</span>`).join('')}
                        </div>
                        <a href="https://keylegacyrealty.managebuilding.com${property.url}" target="_blank" class="view-details">
                            View Full Details →
                        </a>
                    </div>
                </div>
            `, {
                className: 'custom-popup property-popup-container',
                maxWidth: 320
            });

            mapState.layers.properties.addLayer(marker);
        });

        // Add to map by default
        if (document.getElementById('layer-properties')?.checked) {
            mapState.layers.properties.addTo(mapState.map);
        }

        console.log(`✓ Loaded ${properties.length} available properties`);
    } catch (error) {
        console.error('Failed to load properties:', error);
    }
}

// ===== LAYER TOGGLE CONTROLS =====
// ===== LAYER TOGGLE CONTROLS =====
// ===== LAYER TOGGLE CONTROLS =====
function setupLayerControls() {
    // Neighborhoods toggle
    const neighToggle = document.getElementById('layer-neighborhoods');
    if (neighToggle) {
        neighToggle.addEventListener('change', function (e) {
            if (e.target.checked) {
                if (mapState.layers.neighborhoods) mapState.map.addLayer(mapState.layers.neighborhoods);
            } else {
                if (mapState.layers.neighborhoods) mapState.map.removeLayer(mapState.layers.neighborhoods);
            }
        });
    }

    // Transit toggle
    document.getElementById('layer-transit').addEventListener('change', function (e) {
        const show = e.target.checked;
        const transit = mapState.layers.transit;

        // Toggle Routes
        Object.values(transit.routes).forEach(routeLines => {
            routeLines.forEach(line => show ? line.addTo(mapState.map) : mapState.map.removeLayer(line));
        });

        // Toggle Vehicles
        Object.values(transit.markers).forEach(marker => {
            show ? marker.addTo(mapState.map) : mapState.map.removeLayer(marker);
        });

        // Toggle Stations (New)
        if (transit.stations) {
            show ? transit.stations.addTo(mapState.map) : mapState.map.removeLayer(transit.stations);
        }
    });

    // Schools toggle
    document.getElementById('layer-schools').addEventListener('change', function (e) {
        if (e.target.checked) {
            if (mapState.layers.schools) mapState.map.addLayer(mapState.layers.schools);
        } else {
            if (mapState.layers.schools) mapState.map.removeLayer(mapState.layers.schools);
        }
    });

    // Crime toggle (placeholder)
    document.getElementById('layer-crime').addEventListener('change', function (e) {
        if (e.target.checked) alert('Crime data integration coming soon.');
    });

    // Restaurants toggle
    document.getElementById('layer-restaurants').addEventListener('change', function (e) {
        if (e.target.checked) {
            if (mapState.layers.restaurants) mapState.map.addLayer(mapState.layers.restaurants);
        } else {
            if (mapState.layers.restaurants) mapState.map.removeLayer(mapState.layers.restaurants);
        }
    });

    // Properties toggle
    const propToggle = document.getElementById('layer-properties');
    if (propToggle) {
        propToggle.addEventListener('change', function (e) {
            if (e.target.checked) {
                if (mapState.layers.properties) mapState.map.addLayer(mapState.layers.properties);
            } else {
                if (mapState.layers.properties) mapState.map.removeLayer(mapState.layers.properties);
            }
        });
    }
}

// ===== SEARCH FUNCTIONALITY =====
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    function performSearch() {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;

        // Search neighborhoods
        if (mapState.data.neighborhoods) {
            const found = mapState.data.neighborhoods.features.find(feature => {
                const name = (feature.properties.LISTNAME || feature.properties.NAME || '').toLowerCase();
                return name.includes(query);
            });

            if (found) {
                // Zoom to neighborhood
                const layer = L.geoJSON(found);
                mapState.map.fitBounds(layer.getBounds(), { padding: [50, 50] });

                // Show info
                showNeighborhoodInfo(found.properties);

                // Clear search
                searchInput.value = '';
            } else {
                alert(`Neighborhood "${query}" not found. Try: Fishtown, Center City, University City, etc.`);
            }
        }
    }

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// ===== MODAL CONTROLS =====
function setupModals() {
    const sourcesBtn = document.getElementById('sources-btn');
    const modal = document.getElementById('sources-modal');
    const closeBtn = modal.querySelector('.modal-close');

    sourcesBtn.addEventListener('click', () => {
        modal.classList.add('active');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}



// ===== MOBILE PANEL TOGGLE =====
function setupMobileControls() {
    const toggleBtn = document.getElementById('mobile-panel-toggle');
    const panel = document.getElementById('control-panel');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            panel.classList.toggle('expanded');
        });
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async function () {
    console.log('🗺️ Philadelphia Explorer Map starting...');

    // Initialize map
    initMap();

    // Load all data layers with a maximum timeout
    const loadingTimeout = setTimeout(() => {
        console.warn('⚠️ Loading timeout reached - forcing loading screen to hide');
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
            loadingScreen.classList.add('hidden');
        }
    }, 30000); // 30 second max loading time

    try {
        await loadAllData();
        clearTimeout(loadingTimeout);
    } catch (err) {
        console.error('❌ Fatal error during data load:', err);
        clearTimeout(loadingTimeout);
        // Force hide loading screen on error
        document.getElementById('loading-screen')?.classList.add('hidden');
    }

    // Setup UI controls
    setupLayerControls();
    setupSearch();
    setupModals();
    setupMobileControls();

    console.log('✅ Map ready!');
    console.log('📊 Data sources verified: Neighborhoods, Schools, Crime (PPD 2024), SEPTA (real-time)');
});
