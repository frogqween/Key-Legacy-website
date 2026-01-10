# Quick Start Guide

## Run the Map (3 ways)

### Option 1: Double-click (Easiest)
Just open `index.html` in your browser. That's it!

### Option 2: Local Server (Recommended)
```bash
# If you have Python installed:
python -m http.server 8000

# Or if you have Node.js:
npm run start

# Then visit: http://localhost:8000
```

### Option 3: Deploy Online
Upload the entire folder to:
- GitHub Pages
- Netlify (drag & drop)
- Vercel
- Any web host

## Update Properties

Want to add a new rental property to the map?

```bash
# 1. Edit this file:
data/properties-source.js

# 2. Run this command:
npm run update-properties
# (or: node scripts/update-map-properties.js)

# 3. Refresh the map - new property appears!
```

## What You'll See

- 🗺️ Full-screen interactive map
- 🏘️ Philadelphia neighborhoods with boundaries
- 🚊 Live SEPTA trains, trolleys & buses moving in real-time
- 🏫 Schools (click to see details)
- 🛡️ Crime heat map
- 🍽️ Restaurants & landmarks
- 🏠 Rental properties with photos

## Customize

- **Colors**: Edit `css/maps.css`
- **Icons**: Edit `js/maps.js` (search for "SVG")
- **Layout**: Edit `index.html`

## Need Help?

Check the full `README.md` for detailed documentation.

## Performance Tips

- First load takes 10-20 seconds (loading real-time data)
- After that, map is fast and smooth
- SEPTA vehicles update every 10 seconds
- Zoom in/out to see different layers appear

## Data is REAL

All data comes from official sources:
- SEPTA APIs (transit)
- OpenDataPhilly (neighborhoods, schools, crime)
- OpenStreetMap (restaurants, geocoding)

**Zero AI-generated content!**
