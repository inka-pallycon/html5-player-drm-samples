/**
 * CMCD v2 Utility Functions
 * Common utilities for CMCD v2 event mode implementations across different players
 */

// CMCD Event Mode Constants
const CMCD_REPORTING_SERVER_URL = 'http://localhost:3000/cmcd/event-mode';
const CMCD_MODE_QUERY = 'query';
const CMCD_MODE_HEADER = 'header';
const CMCD_MODE_BODY = 'body';

/**
 * Get device type based on platform and user agent
 * @returns {string} Device type (windows, mac, linux, android, ios, unknown)
 */
function getDeviceType() {
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (platform.includes('win')) {
        return 'windows';
    } else if (platform.includes('mac') || userAgent.includes('macintosh')) {
        return 'mac';
    } else if (platform.includes('linux')) {
        return 'linux';
    } else if (userAgent.includes('android')) {
        return 'android';
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        return 'ios';
    } else {
        return 'unknown';
    }
}

/**
 * Get browser name from user agent
 * @returns {string} Browser name (e.g., "Chrome", "Safari", "Firefox")
 */
function getBrowserName() {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('edg/') || userAgent.includes('edge/')) {
        return 'Edge';
    } else if (userAgent.includes('opr') || userAgent.includes('opera')) {
        return 'Opera';
    } else if (userAgent.includes('whale')) {
        return 'Whale';
    } else if (userAgent.includes('chrome')) {
        return 'Chrome';
    } else if (userAgent.includes('safari')) {
        return 'Safari';
    } else if (userAgent.includes('firefox')) {
        return 'Firefox';
    } else {
        return 'Unknown';
    }
}

/**
 * Get browser version from user agent
 * @returns {string} Browser version (e.g., "120.0" or "unknown")
 */
function getBrowserVersion() {
    const userAgent = navigator.userAgent;
    let version = 'unknown';
    
    if (userAgent.includes('Edge/') || userAgent.includes('Edg/')) {
        const match = userAgent.match(/(?:Edge|Edg)\/(\d+(\.\d+)?)/);
        version = match ? match[1] : 'unknown';
    } else if (userAgent.includes('Chrome/')) {
        const match = userAgent.match(/Chrome\/(\d+(\.\d+)?)/);
        version = match ? match[1] : 'unknown';
    } else if (userAgent.includes('Firefox/')) {
        const match = userAgent.match(/Firefox\/(\d+(\.\d+)?)/);
        version = match ? match[1] : 'unknown';
    } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
        const match = userAgent.match(/Version\/(\d+(\.\d+)?)/);
        version = match ? match[1] : 'unknown';
    } else if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) {
        const match = userAgent.match(/(?:Opera|OPR)\/(\d+(\.\d+)?)/);
        version = match ? match[1] : 'unknown';
    }
    
    return version;
}


/**
 * Extract key-value pairs from CMCD string
 * @param {string} cmcdString - CMCD string to parse
 * @param {Object} cmcdData - Object to store parsed data
 */
function extractKeyValuePairs(cmcdString, cmcdData) {
    if (cmcdString === '') {
        return;
    }
    const keyValuePairs = cmcdString.split(',');
    keyValuePairs.forEach(function (keyValuePair) {
        const data = keyValuePair.split('=');
        const key = data[0];
        const value = data[1];
        cmcdData[key] = value;
    });
}

/**
 * Parse CMCD data for query mode
 * @param {Object} event - CMCD event object
 * @returns {Object} Parsed CMCD data
 */
function getKeysForQueryMode(event) {
    const cmcdData = {};
    const cmcdString = event.cmcdString;
    extractKeyValuePairs(cmcdString, cmcdData);
    return cmcdData;
}

/**
 * Parse CMCD data for header mode
 * @param {Object} event - CMCD event object
 * @returns {Object} Parsed CMCD data
 */
function getKeysForHeaderMode(event) {
    const cmcdData = {};
    const keys = Object.keys(event.headers);
    for (const key of keys) {
        extractKeyValuePairs(event.headers[key], cmcdData);
    }
    return cmcdData;
}

/**
 * Parse CMCD data for JSON mode
 * @param {Object} event - CMCD event object
 * @returns {Object} Parsed CMCD data
 */
function getKeysForJsonMode(event) {
    const decoded = decodeURIComponent(event.cmcdString);
    const entries = decoded.split(',');
    const cmcdData = {};

    for (let entry of entries) {
        let [key, value] = entry.split('=');
        if (value?.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        if (!isNaN(value) && value.trim() !== '') {
            value = Number(value);
        }
        cmcdData[key] = value;
    }
    return cmcdData;
}

/**
 * Log message with timestamp
 * @param {string} msg - Message to log
 */
function log(msg) {
    console.log('[' + new Date().toLocaleTimeString() + '] ' + msg);
}

/**
 * Update HTML element with CMCD reporting URL
 * @param {string} elementId - HTML element ID to update
 */
function updateCmcdUrlDisplay(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = CMCD_REPORTING_SERVER_URL;
    }
}

/**
 * Get or create persistent device ID
 * @returns {string} Device ID (UUID v4)
 */
function getDeviceId() {
    const storageKey = 'doverunner_device_id';
    let deviceId = localStorage.getItem(storageKey);

    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem(storageKey, deviceId);
    }

    return deviceId;
}