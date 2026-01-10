# Key Legacy Realty Website

Professional rental property website for Key Legacy Realty, serving the Philadelphia area.

## 🏗️ Project Structure

This repository contains the **Key Legacy Realty** rental property website optimized for GitHub Pages:

```
├── 📄 index.html             # Homepage (entry point)
├── 📄 properties.html        # Property listings
├── 📄 services.html          # Services page
├── 📄 about.html             # About us
├── 📄 contact.html           # Contact page
├── 📄 form.html              # Application form
├── 📂 src/                   # Source code (CSS, JavaScript)
├── 📂 data/                  # Property listings data
├── 📂 assets/                # Static files (PDFs, images, fonts)
├── 📄 README.md              # This file
└── 📄 package.json           # NPM configuration
```

### Detailed Structure

- **Root HTML files** - All website pages for direct GitHub Pages access
- **src/css/** - Stylesheets (style.css, form-style.css)
- **src/js/** - JavaScript (config.js, form.js, utilities)
- **data/** - Property listings (properties.json, properties-source.js)
- **assets/pdf/** - Application documents and notices

## 🚀 Quick Start

### Prerequisites
- A modern web browser
- (Optional) Node.js for development server

### Running Locally

**Option 1: Simple (No server needed)**
```bash
# Just open public/index.html in your browser
open public/index.html  # Mac
start public\index.html # Windows
```

**Option 2: Development Server (Recommended)**
```bash
# Install http-server globally (one time)
npm install -g http-server

# Start development server
npm start

# Visit: http://localhost:8080
```

## 📋 Features

- **Property Listings**: Browse available rentals with filtering
- **Online Application**: Multi-step rental application form
- **Services**: Information about property management services
- **Contact**: Easy ways to reach the team
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🛠️ Development

### File Organization

- **HTML Files**: All in `public/` folder
- **CSS**: Organized in `src/css/`
- **JavaScript**: Modular structure in `src/js/`
- **Configuration**: Centralized in `src/js/config.js`

### Best Practices

1. **Separation of Concerns**: HTML, CSS, and JS are separated
2. **Modular JavaScript**: Utilities and config are separate modules
3. **Centralized Config**: All settings in one place
4. **Clean Structure**: Logical folder organization

### Adding New Properties

Properties are loaded from `data/properties-source.js`. To add a new property:

1. Edit `data/properties-source.js`
2. Add your property to the array:
```javascript
{
    address: "123 Main Street",
    city: "Philadelphia PA 19123",
    beds: 2,
    baths: 1,
    rent: 1500,
    available: "Feb 1",
    img: "property-image.jpg",
    url: "/Resident/public/rentals/12345"
}
```
3. Refresh the website - property appears automatically

## 🎨 Customization

### Colors
Edit `src/css/style.css` - CSS variables are defined at the top:
```css
:root {
    --primary-color: #FF4D00;
    --text-color: #0f0e12;
    /* ... more variables */
}
```

### Contact Information
Update `src/js/config.js`:
```javascript
CONTACT: {
    PHONE: '(215) 778-9352',
    EMAIL: 'hello@keylegacyrealty.com',
    // ...
}
```

### Form Submission
Configure Google Apps Script URL in `src/js/config.js`:
```javascript
GOOGLE_SCRIPT_URL: 'your-script-url-here'
```

## 📦 Deployment

This is a static website - deploy to any hosting service:

- **GitHub Pages**: Push to GitHub, enable Pages
- **Netlify**: Drag and drop `public/` folder
- **Vercel**: Connect repository
- **Traditional hosting**: Upload all files via FTP

### Build for Production

No build step required! Just upload:
1. The entire project structure, OR
2. Just the `public/`, `src/`, `data/`, and `assets/` folders

## 🔒 Security

- Form submissions go through Google Apps Script
- No sensitive data stored in frontend
- All external links use HTTPS
- No API keys exposed in code

## 📱 Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🐛 Troubleshooting

### Forms not submitting
- Check `src/js/config.js` - verify GOOGLE_SCRIPT_URL is correct
- Check browser console for errors

### Images not loading
- Verify image paths in `data/properties-source.js`
- Check Buildium image URLs are accessible

### Styling issues
- Clear browser cache
- Check CSS paths in HTML files
- Verify `src/css/` folder structure

## 📞 Support

For questions or issues:
- Email: hello@keylegacyrealty.com
- Phone: (215) 778-9352

## 📄 License

Private - All rights reserved by Key Legacy Realty

---

Built with ❤️ for Philadelphia renters
