// Utility functions for formatting time and other helpers

/**
 * Format milliseconds into a human-readable time string
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time string
 */
function formatTime(ms) {
    if (ms === 0) return '0 seconds';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    const parts = [];
    
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours % 24 > 0) parts.push(`${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`);
    if (seconds % 60 > 0) parts.push(`${seconds % 60} second${seconds % 60 !== 1 ? 's' : ''}`);
    
    if (parts.length === 0) return '0 seconds';
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts.join(' and ');
    
    return parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];
}

/**
 * Create a progress bar for time visualization
 * @param {number} current - Current time in ms
 * @param {number} max - Maximum time in ms
 * @param {number} length - Length of the progress bar
 * @returns {string} Progress bar string
 */
function createProgressBar(current, max, length = 20) {
    if (max === 0) return '▱'.repeat(length);
    
    const percentage = Math.min(current / max, 1);
    const filled = Math.round(percentage * length);
    const empty = length - filled;
    
    return '▰'.repeat(filled) + '▱'.repeat(empty);
}

/**
 * Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
 * @param {number} num - The number
 * @returns {string} Number with ordinal suffix
 */
function getOrdinal(num) {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const value = num % 100;
    return num + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
}

module.exports = {
    formatTime,
    createProgressBar,
    getOrdinal
};