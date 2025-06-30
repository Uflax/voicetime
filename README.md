# VoiceTime Discord Bot

A Discord bot that tracks the time users spend in voice channels and provides statistics through slash commands.

## Features

- 🎤 **Voice Time Tracking**: Automatically tracks time spent in voice channels
- 📊 **Statistics**: View personal and server-wide voice time statistics
- 🏆 **Leaderboards**: See who spends the most time in voice channels
- 💾 **Persistent Storage**: Uses SQLite database to store data permanently
- ⚡ **Slash Commands**: Modern Discord slash command interface

## Commands

### `/voicetime`
- `/voicetime me` - Check your own voice time
- `/voicetime user @user` - Check another user's voice time
- `/voicetime leaderboard [limit]` - Show voice time leaderboard (default: top 10)

### `/voicestats`
- Shows detailed server statistics including total users tracked, total voice time, average time per user, and most active user

## Setup

### Prerequisites
- Node.js (v16 or higher)
- A Discord application and bot token

### Installation

1. **Clone or download this project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application" and give it a name
   - Go to the "Bot" section and click "Add Bot"
   - Copy the bot token

4. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Replace `your_bot_token_here` with your actual bot token:
   ```
   DISCORD_TOKEN=your_actual_bot_token_here
   ```

5. **Invite the bot to your server**
   - In the Discord Developer Portal, go to OAuth2 > URL Generator
   - Select "bot" and "applications.commands" scopes
   - Select the following permissions:
     - Read Messages/View Channels
     - Send Messages
     - Use Slash Commands
     - Connect (to detect voice channel joins/leaves)
   - Copy the generated URL and open it to invite the bot

6. **Run the bot**
   ```bash
   npm start
   ```

## How It Works

### Voice Tracking
- The bot automatically detects when users join or leave voice channels
- It tracks the duration of each voice session
- Data is stored in a local SQLite database (`voicetime.db`)

### Database Structure
- `voice_time`: Stores cumulative voice time for each user per guild
- `active_sessions`: Tracks currently active voice sessions

### Time Formatting
- Times are displayed in a human-readable format (e.g., "2 hours, 30 minutes, and 15 seconds")
- Progress bars show relative time compared to the top user

## File Structure

```
voicetime-bot/
├── index.js          # Main bot file
├── database.js       # Database operations
├── utils.js          # Utility functions (time formatting, etc.)
├── package.json      # Project dependencies
├── .env.example      # Environment variables template
├── .env              # Your environment variables (create this)
└── voicetime.db      # SQLite database (created automatically)
```

## Troubleshooting

### Bot doesn't respond to commands
- Make sure the bot has the "applications.commands" scope
- Ensure the bot has permission to send messages in the channel
- Check that the bot token is correct in your `.env` file

### Voice time not tracking
- Verify the bot has "Connect" permission (to see voice state changes)
- Make sure the bot is online and running
- Check the console for any error messages

### Database issues
- The SQLite database file (`voicetime.db`) is created automatically
- If you encounter database errors, try deleting the database file and restarting the bot

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License.