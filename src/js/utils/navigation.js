/**
 * Navigation Utilities
 * Handles mobile menu toggle functionality
 */

export function initMobileMenu() {
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    const nav = document.getElementById('mainNav');

    if (toggleButton && nav) {
        toggleButton.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }
}

// For non-module usage (backward compatibility)
if (typeof window !== 'undefined') {
    window.toggleMenu = function() {
        const nav = document.getElementById('mainNav');
        if (nav) {
            nav.classList.toggle('active');
        }
    };
}
