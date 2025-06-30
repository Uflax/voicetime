const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const Database = require('./database');
const { formatTime, createProgressBar, getOrdinal } = require('./utils');
require('dotenv').config();

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages
    ]
});

// Initialize database
const db = new Database();

// Slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('voicetime')
        .setDescription('Check voice time statistics')
        .addSubcommand(subcommand =>
            subcommand
                .setName('me')
                .setDescription('Check your own voice time')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Check another user\'s voice time')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to check')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('Show the voice time leaderboard')
                .addIntegerOption(option =>
                    option.setName('limit')
                        .setDescription('Number of users to show (default: 10)')
                        .setMinValue(1)
                        .setMaxValue(25)
                )
        ),
    
    new SlashCommandBuilder()
        .setName('voicestats')
        .setDescription('Show detailed voice statistics for the server')
];

// When the client is ready
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} is online!`);
    
    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log('🔄 Refreshing application (/) commands...');
        
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        
        console.log('✅ Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('❌ Error refreshing commands:', error);
    }
});

// Handle voice state updates
client.on('voiceStateUpdate', async (oldState, newState) => {
    const userId = newState.id;
    const guildId = newState.guild.id;
    
    try {
        // User joined a voice channel
        if (!oldState.channelId && newState.channelId) {
            await db.startSession(userId, guildId);
            console.log(`📞 ${newState.member.displayName} joined voice channel`);
        }
        
        // User left a voice channel
        if (oldState.channelId && !newState.channelId) {
            await db.endSession(userId, guildId);
            console.log(`📞 ${newState.member.displayName} left voice channel`);
        }
        
        // User switched channels (end old session, start new one)
        if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            await db.endSession(userId, guildId);
            await db.startSession(userId, guildId);
            console.log(`📞 ${newState.member.displayName} switched voice channels`);
        }
    } catch (error) {
        console.error('❌ Error handling voice state update:', error);
    }
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    const { commandName, options } = interaction;
    
    try {
        if (commandName === 'voicetime') {
            const subcommand = options.getSubcommand();
            
            if (subcommand === 'me') {
                const totalTime = await db.getUserTime(interaction.user.id, interaction.guild.id);
                
                const embed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle('🎤 Your Voice Time')
                    .setDescription(`You have spent **${formatTime(totalTime)}** in voice channels in this server.`)
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed] });
            }
            
            else if (subcommand === 'user') {
                const targetUser = options.getUser('target');
                const totalTime = await db.getUserTime(targetUser.id, interaction.guild.id);
                
                const embed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle('🎤 Voice Time')
                    .setDescription(`${targetUser.displayName} has spent **${formatTime(totalTime)}** in voice channels in this server.`)
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed] });
            }
            
            else if (subcommand === 'leaderboard') {
                const limit = options.getInteger('limit') || 10;
                const topUsers = await db.getTopUsers(interaction.guild.id, limit);
                
                if (topUsers.length === 0) {
                    const embed = new EmbedBuilder()
                        .setColor(0xED4245)
                        .setTitle('🎤 Voice Time Leaderboard')
                        .setDescription('No voice time data found for this server yet!');
                    
                    await interaction.reply({ embeds: [embed] });
                    return;
                }
                
                const maxTime = topUsers[0].total_time;
                let description = '';
                
                for (let i = 0; i < topUsers.length; i++) {
                    const userData = topUsers[i];
                    try {
                        const user = await client.users.fetch(userData.user_id);
                        const progressBar = createProgressBar(userData.total_time, maxTime, 15);
                        const position = getOrdinal(i + 1);
                        
                        description += `**${position}** ${user.displayName}\n`;
                        description += `${progressBar} ${formatTime(userData.total_time)}\n\n`;
                    } catch (error) {
                        // Skip users that can't be fetched
                        continue;
                    }
                }
                
                const embed = new EmbedBuilder()
                    .setColor(0x57F287)
                    .setTitle('🏆 Voice Time Leaderboard')
                    .setDescription(description)
                    .setFooter({ text: `Showing top ${topUsers.length} users` })
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed] });
            }
        }
        
        else if (commandName === 'voicestats') {
            const allUsers = await db.getAllUsers(interaction.guild.id);
            
            if (allUsers.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0xED4245)
                    .setTitle('📊 Server Voice Statistics')
                    .setDescription('No voice time data found for this server yet!');
                
                await interaction.reply({ embeds: [embed] });
                return;
            }
            
            const totalTime = allUsers.reduce((sum, user) => sum + user.total_time, 0);
            const averageTime = totalTime / allUsers.length;
            const topUser = allUsers[0];
            
            let topUserName = 'Unknown User';
            try {
                const user = await client.users.fetch(topUser.user_id);
                topUserName = user.displayName;
            } catch (error) {
                // Keep default name if user can't be fetched
            }
            
            const embed = new EmbedBuilder()
                .setColor(0xFEE75C)
                .setTitle('📊 Server Voice Statistics')
                .addFields(
                    { name: '👥 Total Users Tracked', value: allUsers.length.toString(), inline: true },
                    { name: '⏱️ Total Voice Time', value: formatTime(totalTime), inline: true },
                    { name: '📈 Average Time per User', value: formatTime(averageTime), inline: true },
                    { name: '🥇 Most Active User', value: `${topUserName}\n${formatTime(topUser.total_time)}`, inline: false }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
    } catch (error) {
        console.error('❌ Error handling command:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('❌ Error')
            .setDescription('An error occurred while processing your command. Please try again later.');
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
});

// Handle errors
client.on('error', error => {
    console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🔄 Shutting down gracefully...');
    db.close();
    client.destroy();
    process.exit(0);
});

// Login to Discord
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN not found in environment variables!');
    console.log('📝 Please create a .env file with your bot token:');
    console.log('   DISCORD_TOKEN=your_bot_token_here');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);