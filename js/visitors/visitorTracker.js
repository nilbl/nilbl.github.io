// === VISITOR TRACKING SYSTEM ===

import { getVisitorLocation } from './geolocation.js';
import { updateVisitorDisplay } from './mapRenderer.js';
import { showConsentPopup } from './consentPopup.js';
import { addVisitor, getAllVisitors } from './firebaseService.js';

/**
 * Initialize visitor tracking with Firebase
 */
export async function initVisitorTracking() {
    const canvas = document.getElementById('visitorCanvas');
    if (!canvas) return;

    // Check if user already gave consent
    const hasConsent = localStorage.getItem('visitor-tracking-consent');

    try {
        // Load and display existing data from Firebase
        const visitors = await getAllVisitors();
        const data = {
            visitors: visitors,
            totalVisits: visitors.length
        };
        updateVisitorDisplay(data);

        // If no consent decision yet, ask
        let consent = hasConsent === 'true';
        if (!hasConsent || hasConsent === 'null') {
            consent = await showConsentPopup();
            localStorage.setItem('visitor-tracking-consent', consent.toString());
        }

        if (!consent) {
            const yourLocationEl = document.getElementById('yourLocation');
            if (yourLocationEl) {
                yourLocationEl.textContent = 'Not shared';
            }
            return;
        }

        // Get current location
        const location = await getVisitorLocation();
        const yourLocationEl = document.getElementById('yourLocation');
        if (yourLocationEl) {
            yourLocationEl.textContent = `${location.city}, ${location.country}`;
        }

        // Add current visit to Firebase
        await addVisitor(location);

        // Reload all visitors and update display
        const updatedVisitors = await getAllVisitors();
        const updatedData = {
            visitors: updatedVisitors,
            totalVisits: updatedVisitors.length
        };
        updateVisitorDisplay(updatedData);

    } catch (error) {
        console.error('Error initializing visitor tracking:', error);
        // Fallback: show empty state
        updateVisitorDisplay({ visitors: [], totalVisits: 0 });
    }
}

/**
 * Setup visitor tracking events
 */
export function setupVisitorTracking() {
    // Listen for custom event when visitors section is shown
    window.addEventListener('visitorsSectionShown', () => {
        console.log('Visitors section shown event received');
        initVisitorTracking();
    });

    // Initialize when visitors section is shown on load
    const visitorSection = document.getElementById('visitorsSection');
    if (visitorSection && visitorSection.classList.contains('active')) {
        initVisitorTracking();
    }
}
