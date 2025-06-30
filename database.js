const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'voicetime.db'));
        this.init();
    }

    init() {
        // Create tables if they don't exist
        this.db.serialize(() => {
            // Table to store voice time data
            this.db.run(`
                CREATE TABLE IF NOT EXISTS voice_time (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    guild_id TEXT NOT NULL,
                    total_time INTEGER DEFAULT 0,
                    UNIQUE(user_id, guild_id)
                )
            `);

            // Table to track active voice sessions
            this.db.run(`
                CREATE TABLE IF NOT EXISTS active_sessions (
                    user_id TEXT NOT NULL,
                    guild_id TEXT NOT NULL,
                    join_time INTEGER NOT NULL,
                    PRIMARY KEY(user_id, guild_id)
                )
            `);
        });
    }

    // Start tracking a user's voice session
    startSession(userId, guildId) {
        return new Promise((resolve, reject) => {
            const joinTime = Date.now();
            this.db.run(
                'INSERT OR REPLACE INTO active_sessions (user_id, guild_id, join_time) VALUES (?, ?, ?)',
                [userId, guildId, joinTime],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    // End tracking and update total time
    endSession(userId, guildId) {
        return new Promise((resolve, reject) => {
            const currentTime = Date.now();
            
            // Get the join time
            this.db.get(
                'SELECT join_time FROM active_sessions WHERE user_id = ? AND guild_id = ?',
                [userId, guildId],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (!row) {
                        resolve(); // No active session found
                        return;
                    }

                    const sessionTime = currentTime - row.join_time;
                    
                    // Update total time
                    this.db.run(
                        `INSERT INTO voice_time (user_id, guild_id, total_time) 
                         VALUES (?, ?, ?) 
                         ON CONFLICT(user_id, guild_id) 
                         DO UPDATE SET total_time = total_time + ?`,
                        [userId, guildId, sessionTime, sessionTime],
                        (err) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            
                            // Remove from active sessions
                            this.db.run(
                                'DELETE FROM active_sessions WHERE user_id = ? AND guild_id = ?',
                                [userId, guildId],
                                (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                }
                            );
                        }
                    );
                }
            );
        });
    }

    // Get user's total voice time
    getUserTime(userId, guildId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT total_time FROM voice_time WHERE user_id = ? AND guild_id = ?',
                [userId, guildId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row ? row.total_time : 0);
                }
            );
        });
    }

    // Get top users by voice time in a guild
    getTopUsers(guildId, limit = 10) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT user_id, total_time FROM voice_time WHERE guild_id = ? ORDER BY total_time DESC LIMIT ?',
                [guildId, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    // Get all users with voice time in a guild
    getAllUsers(guildId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT user_id, total_time FROM voice_time WHERE guild_id = ? ORDER BY total_time DESC',
                [guildId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    close() {
        this.db.close();
    }
}

module.exports = Database;