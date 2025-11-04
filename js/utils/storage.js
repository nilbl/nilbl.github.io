// === LOCAL STORAGE UTILITIES ===

/**
 * Safely get data from localStorage
 * @param {string} key - The storage key
 * @param {string} defaultValue - Default value if key doesn't exist
 * @returns {string} The stored value or default
 */
export function safeGetLocalStorage(key, defaultValue) {
    try {
        return localStorage.getItem(key) || defaultValue;
    } catch (e) {
        console.warn('localStorage access denied:', e);
        return defaultValue;
    }
}

/**
 * Safely set data in localStorage
 * @param {string} key - The storage key
 * @param {string} value - The value to store
 */
export function safeSetLocalStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn('localStorage write failed:', e);
    }
}

/**
 * Get JSON data from localStorage
 * @param {string} key - The storage key
 * @param {*} defaultValue - Default value if key doesn't exist or parse fails
 * @returns {*} Parsed JSON or default value
 */
export function getJSON(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

/**
 * Set JSON data in localStorage
 * @param {string} key - The storage key
 * @param {*} value - The value to store (will be JSON stringified)
 */
export function setJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn('localStorage JSON write failed:', e);
    }
}
