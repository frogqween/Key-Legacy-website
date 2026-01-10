/**
 * Application Configuration
 * Central configuration file for all settings
 */

export const CONFIG = {
    // Google Apps Script endpoint for form submissions
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyg6r7zjukCo6KgaB-eYhxnTf0jmoW-6gyynF-t_Cz37CMmbFNcJBQ2e6njNxzcxhx6AQ/exec',

    // Buildium API configuration
    BUILDIUM_BASE_URL: 'https://keylegacyrealty.managebuilding.com',
    BUILDIUM_IMAGE_PATH: '/Resident/api/public/files/download',

    // Form settings
    FORM: {
        TOTAL_SECTIONS: 4,
        VALIDATION_DELAY: 300, // ms before validation kicks in
    },

    // Property settings
    PROPERTIES: {
        DEFAULT_IMAGE: 'placeholder.jpg',
        ITEMS_PER_PAGE: 12,
    },

    // Contact information
    CONTACT: {
        PHONE: '(215) 778-9352',
        EMAIL: 'hello@keylegacyrealty.com',
        ADDRESS: {
            STREET: '100 N 18th St, Suite 300',
            CITY: 'Philadelphia',
            STATE: 'PA',
            ZIP: '19103'
        }
    }
};

// Make config available globally for non-module scripts
if (typeof window !== 'undefined') {
    window.APP_CONFIG = CONFIG;
}
