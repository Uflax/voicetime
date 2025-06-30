// Configuration and validation utilities
require('dotenv').config();

const config = {
    // Bot token from environment
    token: process.env.DISCORD_TOKEN,
    
    // Database configuration
    database: {
        filename: 'voicetime.db',
        // You can add more database options here if needed
    },
    
    // Bot settings
    bot: {
        // Default number of users to show in leaderboard
        defaultLeaderboardLimit: 10,
        maxLeaderboardLimit: 25,
        
        // Colors for embeds (in hex)
        colors: {
            primary: 0x5865F2,    // Discord Blurple
            success: 0x57F287,    // Green
            warning: 0xFEE75C,    // Yellow
            error: 0xED4245       // Red
        }
    }
};

// Validation function
function validateConfig() {
    const errors = [];
    
    if (!config.token) {
        errors.push('DISCORD_TOKEN is not set in environment variables');
    }
    
    if (config.token === 'your_bot_token_here') {
        errors.push('DISCORD_TOKEN is still set to the default placeholder value');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    config,
    validateConfig
};