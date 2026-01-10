/**
 * Geocode real property addresses to lat/lng coordinates
 * Uses Nominatim (OpenStreetMap) geocoding API - free, no API key required
 */

const properties = [
    { address: "510 West Girard Avenue", city: "Philadelphia PA 19123", beds: 2, baths: 1, rent: 1350, available: "Nov 1", img: "394d0d2f55894f90bb65ae8e7f6be355_406x539.jpg", url: "/Resident/public/rentals/45461" },
    { address: "1917 North 7th Street", city: "Philadelphia PA 19122", beds: 2, baths: 2, rent: 1800, available: "Nov 1", img: "6f4caca9628243d9be5bc0d2be281123_406x539.jpg", url: "/Resident/public/rentals/56526" },
    { address: "2009 North Darien Street - 2", city: "Philadelphia PA 19122", beds: 3, baths: 3, rent: 2100, available: "Nov 1", img: "55603aefd5874e63a60905286125d647_406x539.jpg", url: "/Resident/public/rentals/56528" },
    { address: "4614 Rising Sun Avenue", city: "Philadelphia PA 19140", beds: 1, baths: 1, rent: 1050, available: "Nov 1", img: "120cede3e6794003a7be71128b984d89_406x539.jpg", url: "/Resident/public/rentals/43913" },
    { address: "5322 Angora Terrace", city: "Philadelphia PA 19143", beds: 2, baths: 1, rent: 1375, available: "Nov 1", img: "460af2d98d3a4c1d8771a78200305737_406x539.jpg", url: "/Resident/public/rentals/54439" },
    { address: "5504 Devon Street", city: "Philadelphia PA 19138", beds: 4, baths: 1, rent: 2000, available: "Nov 22", img: "b09891a5d6a04192a6a3af6c06406abe_406x539.jpg", url: "/Resident/public/rentals/57109" },
    { address: "3625 North 22nd Street - 2", city: "Philadelphia PA 19140", beds: 2, baths: 1, rent: 1275, available: "Nov 27", img: "bd478354aaa444b48a2c6d0d03fa874d_406x539.jpg", url: "/Resident/public/rentals/56692" },
    { address: "45-49 East Cliveden Street - 1B", city: "Philadelphia PA 19144", beds: "Studio", baths: 1, rent: 995, available: "Dec 1", img: "d41e4eba848c4a4497e6030bd082967c_406x539.jpg", url: "/Resident/public/rentals/57382" },
    { address: "45-49 East Cliveden Street - 405", city: "Philadelphia PA 19144", beds: 1, baths: 1, rent: 1295, available: "Dec 1", img: "495273e80694478ea888aeadcb885e04_406x539.jpg", url: "/Resident/public/rentals/57383" },
    { address: "45-49 East Cliveden Street - 408", city: "Philadelphia PA 19144", beds: 2, baths: 1, rent: 1495, available: "Dec 1", img: "5ea9eec1d99e48ecb313bb43e93cf202_406x539.jpg", url: "/Resident/public/rentals/57384" },
    { address: "262 East Cliveden Street - 3", city: "Philadelphia PA 19119", beds: 1, baths: 1, rent: 1295, available: "Dec 1", img: "2a22335afbc6449d8eb7c9f8042e1a81_406x539.jpg", url: "/Resident/public/rentals/57381" },
    { address: "262 East Cliveden Street - 4", city: "Philadelphia PA 19119", beds: 1, baths: 1, rent: 1295, available: "Dec 1", img: "06339a42f7c24f4b8f8cac2ad7620329_406x539.jpg", url: "/Resident/public/rentals/57380" },
    { address: "262 East Cliveden Street - 208", city: "Philadelphia PA 19119", beds: 1, baths: 1, rent: 1295, available: "Dec 1", img: "6ba129d1bd1c4f94ad0bbba47e68fcc3_406x539.jpg", url: "/Resident/public/rentals/57379" },
    { address: "625 Vernon Road - GB", city: "Philadelphia PA 19119", beds: 1, baths: 1, rent: 1250, available: "Dec 1", img: "7046eb99f3ff444bbc32dc2e6623786c_406x539.jpg", url: "/Resident/public/rentals/57392" },
    { address: "3625 North 22nd Street - 1", city: "Philadelphia PA 19140", beds: 3, baths: 1, rent: 1475, available: "Dec 1", img: "61f4d36c9bfb46e6bf7eb7e332e2ae57_406x539.jpg", url: "/Resident/public/rentals/56685" },
    { address: "5424 Rising Sun Avenue - B8", city: "Philadelphia PA 19120", beds: 2, baths: 1, rent: 1495, available: "Dec 1", img: "9dcafa1df6f24999ba2fc0a6705737b6_406x539.jpg", url: "/Resident/public/rentals/57397" },
    { address: "5424 Rising Sun Avenue B7", city: "Philadelphia PA 19120", beds: 1, baths: 1, rent: 1295, available: "Dec 1", img: "c3bb2c95cafe4354a923435b421463b1_406x539.jpg", url: "/Resident/public/rentals/57396" },
    { address: "6001 North 17th Street - 403", city: "Philadelphia PA 19141", beds: 1, baths: 1, rent: 1195, available: "Dec 1", img: "435233c2296f41bd9dbbf5df420071c2_406x539.jpg", url: "/Resident/public/rentals/57394" },
    { address: "6001 North 17th Street - 404", city: "Philadelphia PA 19141", beds: 1, baths: 1, rent: 1195, available: "Dec 1", img: "a08b9e2f0a5541ce8935c0bacde3ea00_406x539.jpg", url: "/Resident/public/rentals/57393" },
    { address: "6100 McCallum Street - 2H", city: "Philadelphia PA 19144", beds: 1, baths: 1, rent: 1295, available: "Dec 1", img: "287d88152ab74719a9e0b07871e4ff89_406x539.jpg", url: "/Resident/public/rentals/57388" },
    { address: "6100 McCallum Street - 3F", city: "Philadelphia PA 19144", beds: 1, baths: 1, rent: 1295, available: "Dec 1", img: "https://i.ytimg.com/vi/j5xbyAWVow4/hqdefault.jpg", url: "/Resident/public/rentals/57387" },
    { address: "6600 Lincoln Drive - C4", city: "Philadelphia PA 19119", beds: 3, baths: 2, rent: 1995, available: "Dec 1", img: "fa7a338374ef411fa6be93cc5aa86c07_406x539.jpg", url: "/Resident/public/rentals/57385" },
    { address: "6644 North 8th Street - A4", city: "Philadelphia PA 19126", beds: 1, baths: 1, rent: 1195, available: "Dec 1", img: "1858e567c2a14affb52a637a241d7fe9_406x539.jpg", url: "/Resident/public/rentals/57395" },
    { address: "7057 Cresheim Road - 2", city: "Philadelphia PA 19119", beds: 1, baths: 1, rent: 1295, available: "Dec 1", img: "9758c56bf49248afafa5bd50b6654da2_406x539.jpg", url: "/Resident/public/rentals/57391" }
];

async function geocodeAddress(address, city) {
    // Remove unit numbers for better geocoding
    const streetAddress = address.split(' - ')[0].split(' -')[0];
    const fullAddress = `${streetAddress}, ${city}`;

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
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error(`Failed to geocode ${fullAddress}:`, error);
        return null;
    }
}

async function geocodeAll() {
    const results = [];

    for (let i = 0; i < properties.length; i++) {
        const prop = properties[i];
        console.log(`Geocoding ${i + 1}/${properties.length}: ${prop.address}...`);

        const coords = await geocodeAddress(prop.address, prop.city);

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
                featured: i < 3 // First 3 properties are featured
            });
            console.log(`✓ Found: ${coords.lat}, ${coords.lng}`);
        } else {
            console.warn(`✗ Could not geocode: ${prop.address}`);
        }

        // Rate limiting: wait 1 second between requests (Nominatim policy)
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Output as JSON
    console.log('\n=== GEOCODED PROPERTIES JSON ===\n');
    console.log(JSON.stringify(results, null, 2));

    // Save to file
    const fs = require('fs');
    fs.writeFileSync('../data/properties.json', JSON.stringify(results, null, 2));
    console.log('\n✓ Saved to data/properties.json');
}

function extractNeighborhood(city) {
    // Extract zip code and map to neighborhood
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

// Run geocoding
geocodeAll().catch(console.error);
