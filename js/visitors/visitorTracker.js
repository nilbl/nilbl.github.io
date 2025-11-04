// === VISITOR TRACKING SYSTEM ===

import { getVisitorLocation } from './geolocation.js';
import { updateVisitorDisplay } from './mapRenderer.js';
import { showConsentPopup } from './consentPopup.js';

const VISITOR_STORAGE_KEY = 'visitor-tracking-data';
const MAX_VISITORS = 50; // Keep last 50 visitors

/**
 * Get visitor data from localStorage
 * @returns {Object} Visitor data { visitors: [], totalVisits: 0 }
 */
export function getVisitorData() {
    try {
        const data = localStorage.getItem(VISITOR_STORAGE_KEY);
        return data ? JSON.parse(data) : { visitors: [], totalVisits: 0 };
    } catch (e) {
        return { visitors: [], totalVisits: 0 };
    }
}

/**
 * Save visitor data to localStorage
 * @param {Object} data - Visitor data to save
 */
export function saveVisitorData(data) {
    try {
        localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.log('Could not save visitor data');
    }
}

/**
 * Initialize visitor tracking
 */
export async function initVisitorTracking() {
    const canvas = document.getElementById('visitorCanvas');
    if (!canvas) return; // Not on visitors page

    // Check if user already gave consent
    const hasConsent = localStorage.getItem('visitor-tracking-consent');

    // Load and display existing data first
    const data = getVisitorData();
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
        return; // Don't track if user declined
    }

    // Get current location
    const location = await getVisitorLocation();
    const yourLocationEl = document.getElementById('yourLocation');
    if (yourLocationEl) {
        yourLocationEl.textContent = `${location.city}, ${location.country}`;
    }

    // Add current visit
    data.visitors.push(location);
    data.totalVisits++;

    // Keep only last MAX_VISITORS
    if (data.visitors.length > MAX_VISITORS) {
        data.visitors = data.visitors.slice(-MAX_VISITORS);
    }

    // Save data
    saveVisitorData(data);

    // Update display
    updateVisitorDisplay(data);
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
