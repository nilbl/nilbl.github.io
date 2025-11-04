// === GEOLOCATION SERVICE ===

/**
 * Fetch visitor location using IP geolocation API
 * @returns {Promise<Object>} Location data
 */
export async function getVisitorLocation() {
    try {
        // Using ipapi.co - free tier, no API key needed
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Geolocation failed');
        const data = await response.json();
        return {
            city: data.city || 'Unknown',
            country: data.country_name || 'Unknown',
            countryCode: data.country_code || 'XX',
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            timestamp: new Date().toISOString()
        };
    } catch (e) {
        // Fallback: estimate from timezone
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return {
            city: tz.split('/')[1] || 'Unknown',
            country: 'Unknown',
            countryCode: 'XX',
            latitude: 0,
            longitude: 0,
            timestamp: new Date().toISOString()
        };
    }
}
