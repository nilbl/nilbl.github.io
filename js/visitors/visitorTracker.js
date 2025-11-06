// === VISITOR TRACKING SYSTEM ===

import { getVisitorLocation } from './geolocation.js';
import { updateVisitorDisplay } from './mapRenderer.js';
import { showConsentPopup } from './consentPopup.js';
import { addVisitor, getAllVisitors } from './firebaseService.js';

// Track if location has been captured
let locationCaptured = false;

/**
 * Capture visitor location on main page load (after character selection)
 * This runs once when entering the main page
 */
export async function captureVisitorLocation() {
    console.log('📍 captureVisitorLocation() called');

    // Only capture once per session
    if (locationCaptured) {
        console.log('❌ Location already captured this session');
        return;
    }

    // Check if user already gave consent
    const hasConsent = localStorage.getItem('visitor-tracking-consent');
    console.log('🔍 Consent status from localStorage:', hasConsent);

    try {
        // If no consent decision yet, ask
        let consent = hasConsent === 'true';
        if (!hasConsent || hasConsent === 'null') {
            console.log('🎯 Showing consent popup...');
            consent = await showConsentPopup();
            console.log('✅ User consent result:', consent);
            localStorage.setItem('visitor-tracking-consent', consent.toString());
        } else {
            console.log('✅ Using cached consent:', consent);
        }

        if (!consent) {
            console.log('❌ User declined location tracking');
            locationCaptured = true;
            return;
        }

        // Get current country and save to Firebase
        console.log('🌍 Fetching visitor location...');
        const location = await getVisitorLocation();
        console.log('📍 Location fetched:', location);

        console.log('💾 Saving to Firebase...');
        await addVisitor(location);
        console.log('✅ Saved to Firebase successfully');

        locationCaptured = true;
        console.log('✅ Visitor country captured:', location.country);

    } catch (error) {
        console.error('❌ Error capturing visitor location:', error);
        locationCaptured = true; // Don't retry on error
    }
}

/**
 * Display visitors map when visiting the visitors section
 */
async function displayVisitorsMap() {
    const canvas = document.getElementById('visitorCanvas');
    if (!canvas) return;

    try {
        // Load and display existing data from Firebase
        const visitors = await getAllVisitors();
        const data = {
            visitors: visitors,
            totalVisits: visitors.length
        };
        updateVisitorDisplay(data);

    } catch (error) {
        console.error('Error displaying visitors map:', error);
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
        displayVisitorsMap();
    });

    // Initialize when visitors section is shown on load
    const visitorSection = document.getElementById('visitorsSection');
    if (visitorSection && visitorSection.classList.contains('active')) {
        displayVisitorsMap();
    }
}
