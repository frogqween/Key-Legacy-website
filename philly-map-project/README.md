# Philadelphia Interactive Map

A standalone, real-time interactive map of Philadelphia with live transit data, neighborhoods, schools, crime statistics, restaurants, and rental properties.

## Features

### Live Data Layers
- 🏘️ **Neighborhoods** - Philadelphia neighborhood boundaries with demographics
- 🚊 **SEPTA Transit (Real-Time)** - Live positions of trains, trolleys, and buses (updates every 10 seconds)
- 🏫 **Schools** - Public and private schools with ratings
- 🛡️ **Safety Data** - Crime statistics heat map
- 🍽️ **Restaurants & Landmarks** - Popular dining and attractions
- 🏠 **Available Properties** - Real rental listings with photos and details

### Key Features
- Real-time SEPTA vehicle tracking with custom icons
- Progressive layer visibility based on zoom level (reduces clutter)
- Intelligent marker clustering for schools and restaurants
- Interactive neighborhood profiles with stats
- Search functionality for neighborhoods
- Mobile-responsive design
- All data from verified sources (NO AI-generated content)

## Quick Start

### Run Locally

Simply open `index.html` in your browser. No build process or server required!

```bash
# Option 1: Open directly
open index.html  # Mac
start index.html # Windows

# Option 2: Use a local server (recommended)
python -m http.server 8000
# Then visit: http://localhost:8000
```

### Deploy

This is a static site - deploy to any hosting service:
- GitHub Pages
- Netlify
- Vercel
- AWS S3
- Your own web server

## Project Structure

```
philly-map-project/
├── index.html              # Main HTML file (standalone, full-screen map)
├── css/
│   └── maps.css           # All map styling
├── js/
│   └── maps.js            # Core map logic and data loading
├── data/
│   ├── neighborhoods.geojson    # Neighborhood boundaries
│   ├── schools.geojson          # School locations
│   ├── crime-2024.csv           # Crime statistics
│   ├── restaurants.json         # Restaurant/landmark data
│   ├── properties.json          # Geocoded property listings
│   └── properties-source.js     # Property source data
├── scripts/
│   ├── geocode-properties.js         # Initial geocoding script
│   └── update-map-properties.js      # Auto-update property coordinates
└── README.md
```

## Updating Properties

The map can display rental properties. To add or update properties:

### 1. Edit the source file
Edit `data/properties-source.js` and add your property:

```javascript
const PROPERTIES_DATA = [
    // ... existing properties ...
    {
        address: "123 Main Street",
        city: "Philadelphia PA 19123",
        beds: 2,
        baths: 1,
        rent: 1500,
        available: "Jan 1",
        img: "your-image.jpg",
        url: "/Resident/public/rentals/12345"
    }
];
```

### 2. Run the update script
```bash
node scripts/update-map-properties.js
```

This will:
- Geocode new addresses to latitude/longitude
- Use cached coordinates for existing properties (instant!)
- Auto-generate neighborhood, amenities, and descriptions
- Update `data/properties.json`

### 3. Done!
Refresh the map - your new property appears with an accurate marker.

## Data Sources

All data is from verified, authentic sources:

- **Neighborhoods**: City of Philadelphia (OpenDataPhilly)
- **Transit**: SEPTA Official APIs (real-time)
- **Schools**: School District of Philadelphia
- **Crime**: Philadelphia Police Department
- **Restaurants**: OpenStreetMap via Overpass API
- **Properties**: Your own listings (geocoded via OpenStreetMap Nominatim)

## Technologies Used

- **Leaflet.js** - Interactive map library
- **Leaflet MarkerCluster** - Efficient marker clustering
- **SEPTA APIs** - Real-time transit data
- **OpenStreetMap Nominatim** - Geocoding service
- **Overpass API** - Restaurant/landmark data
- **OpenDataPhilly** - City datasets

## Browser Support

Works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Initial load: 10-20 seconds (loading all real-time data)
- SEPTA updates: Every 10 seconds
- Clustering reduces markers for smooth performance
- Progressive layer loading prevents information overload

## Customization

### Change Map Colors
Edit `css/maps.css` - search for color values like `#FF4D00` (property orange) or `#0099FF` (SEPTA blue)

### Add New Data Layers
1. Add data file to `data/` folder
2. Create loader function in `js/maps.js` (follow existing patterns)
3. Add toggle control in `index.html`
4. Call loader in `loadAllData()`

### Modify SEPTA Vehicle Icons
Edit the SVG icons in `js/maps.js` around line 608-672

## Future Enhancements

Potential features to add:
- [ ] Bike lanes and bike share stations
- [ ] Parks and green spaces
- [ ] Public WiFi hotspots
- [ ] Building permits (new construction)
- [ ] Walk scores
- [ ] Neighborhood comparison tool
- [ ] Save favorite locations
- [ ] Share map view via URL

## License

This is a side project - use it however you want!

## Credits

Built with real-time data from SEPTA, OpenDataPhilly, and OpenStreetMap.

Map UI inspired by modern real estate and transit apps.
