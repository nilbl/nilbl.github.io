// === GEOLOCATION SERVICE (GDPR Compliant) ===

/**
 * Fetch visitor country using IP geolocation API
 * Only collects country-level data for GDPR compliance
 * @returns {Promise<Object>} Country data only (no precise location)
 */
export async function getVisitorLocation() {
    try {
        // Using ipapi.co - only requesting country data
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Geolocation failed');
        const data = await response.json();
        return {
            country: data.country_name || 'Unknown',
            countryCode: data.country_code || 'XX',
            timestamp: new Date().toISOString()
        };
    } catch (e) {
        // Fallback: return unknown
        return {
            country: 'Unknown',
            countryCode: 'XX',
            timestamp: new Date().toISOString()
        };
    }
}
