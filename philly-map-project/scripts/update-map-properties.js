#!/usr/bin/env node
/**
 * AUTOMATIC MAP PROPERTY UPDATER
 *
 * This script reads properties from data/properties-source.js,
 * geocodes any new addresses, and updates data/properties.json
 *
 * Run this whenever you add/update properties to sync with the map!
 *
 * Usage: node scripts/update-map-properties.js
 */

const fs = require('fs');
const path = require('path');

// Load the source properties (shared with main site)
const PROPERTIES_DATA = require('../../data/properties-source.js');

// Load existing geocoded properties (if they exist)
let existingGeocodedProperties = [];
const geocodedFilePath = path.join(__dirname, '../data/properties.json');

if (fs.existsSync(geocodedFilePath)) {
    existingGeocodedProperties = JSON.parse(fs.readFileSync(geocodedFilePath, 'utf8'));
}

// Create a lookup map for existing coordinates
const geocodeCache = {};
existingGeocodedProperties.forEach(prop => {
    const key = `${prop.address}, ${prop.city}`;
    geocodeCache[key] = { lat: prop.lat, lng: prop.lng };
});

console.log('🗺️  Property Map Auto-Update Tool');
console.log('=' .repeat(50));
console.log(`📍 Found ${PROPERTIES_DATA.length} properties in source`);
console.log(`💾 Found ${Object.keys(geocodeCache).length} cached coordinates`);
console.log('');

async function geocodeAddress(address, city) {
    const streetAddress = address.split(' - ')[0].split(' -')[0];
    const fullAddress = `${streetAddress}, ${city}`;

    // Check cache first
    const cacheKey = `${address}, ${city}`;
    if (geocodeCache[cacheKey]) {
        console.log(`  ✓ Using cached coords for ${address}`);
        return geocodeCache[cacheKey];
    }

    const url = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
        q: fullAddress,
        format: 'json',
        limit: 1
    });

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Key Legacy Realty Map Application'
            }
        });
        const data = await response.json();

        if (data && data.length > 0) {
            const coords = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
            geocodeCache[cacheKey] = coords;
            return coords;
        }
        return null;
    } catch (error) {
        console.error(`  ✗ Failed to geocode ${fullAddress}:`, error.message);
        return null;
    }
}

function extractNeighborhood(city) {
    const zipMatch = city.match(/(\d{5})/);
    if (!zipMatch) return 'Philadelphia';

    const zip = zipMatch[1];
    const zipToNeighborhood = {
        '19123': 'Northern Liberties',
        '19122': 'North Philadelphia',
        '19140': 'North Philadelphia',
        '19143': 'Southwest Philadelphia',
        '19138': 'West Oak Lane',
        '19144': 'Germantown',
        '19119': 'Mount Airy',
        '19120': 'Olney',
        '19141': 'Ogontz',
        '19126': 'Ogontz'
    };

    return zipToNeighborhood[zip] || 'Philadelphia';
}

async function updateMapProperties() {
    const results = [];
    let newlyGeocoded = 0;

    for (let i = 0; i < PROPERTIES_DATA.length; i++) {
        const prop = PROPERTIES_DATA[i];
        const cacheKey = `${prop.address}, ${prop.city}`;

        console.log(`[${i + 1}/${PROPERTIES_DATA.length}] ${prop.address}...`);

        let coords = geocodeCache[cacheKey];

        if (!coords) {
            coords = await geocodeAddress(prop.address, prop.city);
            newlyGeocoded++;
            // Rate limiting: wait 1 second between new requests (Nominatim policy)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (coords) {
            results.push({
                id: `prop-${String(i + 1).padStart(3, '0')}`,
                address: prop.address,
                fullAddress: `${prop.address}, ${prop.city}`,
                city: prop.city,
                lat: coords.lat,
                lng: coords.lng,
                neighborhood: extractNeighborhood(prop.city),
                price: prop.rent,
                bedrooms: prop.beds === 'Studio' ? 0 : prop.beds,
                bathrooms: prop.baths,
                available: prop.available,
                image: prop.img,
                url: prop.url,
                featured: i < 3, // First 3 properties are featured
                sqft: Math.round(400 + ((prop.beds === 'Studio' ? 0 : prop.beds) * 300) + Math.random() * 200),
                amenities: [
                    (prop.beds === 'Studio' || prop.beds < 2) ? 'Modern finishes' : 'Hardwood floors',
                    prop.baths >= 2 ? 'Updated bathrooms' : 'Updated kitchen',
                    prop.rent < 1300 ? 'Great value' : 'Premium location'
                ],
                description: `${prop.beds === 'Studio' ? 'Cozy studio' : prop.beds + 'BR'} in ${extractNeighborhood(prop.city)} with convenient access to transit and local amenities.`
            });
        } else {
            console.warn(`  ⚠️  Could not geocode: ${prop.address}`);
        }
    }

    // Save to file
    fs.writeFileSync(geocodedFilePath, JSON.stringify(results, null, 2));

    console.log('');
    console.log('=' .repeat(50));
    console.log(`✅ Success! Updated data/properties.json`);
    console.log(`📊 Total properties: ${results.length}`);
    console.log(`🆕 Newly geocoded: ${newlyGeocoded}`);
    console.log(`💾 From cache: ${results.length - newlyGeocoded}`);
    console.log('');
    console.log('🗺️  Map will now show the latest properties!');
}

// Run the update
updateMapProperties().catch(console.error);
