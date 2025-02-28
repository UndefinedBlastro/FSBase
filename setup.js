import fs from 'fs';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import chalk from 'chalk';

async function setup() {
    console.log(chalk.blue.bold("\n🔧 Welcome to the Discord Bot Setup!\n"));

    // Ask user for bot details and optional dependencies
    const answers = await inquirer.prompt([
        { name: 'botToken', message: chalk.cyan('Enter your Discord bot token:'), type: 'input' },
        { name: 'mongoURI', message: chalk.cyan('Enter your MongoDB connection URI:'), type: 'input' },
        { name: 'prefix', message: chalk.cyan('Enter your bot prefix:'), type: 'input' },

        {
            name: 'extraPackages',
            message: chalk.yellow('Select additional features to install:'),
            type: 'checkbox',
            choices: [
                { name: chalk.green('🎨 Canvas (ForgeCanvas)'), value: 'ForgeCanvas' },
                { name: chalk.green('💾 ForgeDB (Database System)'), value: 'ForgeDB' },
                { name: chalk.green('🔍 ForgeRegex (Regex Tools)'), value: 'ForgeRegex' }
            ]
        }
    ]);

    // Create `.env` file
    const envContent = `TOKEN="${answers.botToken}"
    MONGO_URI="${answers.mongoURI}";
    prefix="${answers.prefix}"`;
    fs.writeFileSync('.env', envContent);
    console.log(chalk.green.bold("✅ `.env` file created.\n"));

    // Install necessary dependencies
    console.log(chalk.magenta("📦 Installing core dependencies..."));
    execSync('npm install @tryforge/forgescript mongoose dotenv chalk@4.1.2', { stdio: 'inherit' });

    // Install optional dependencies
    if (answers.extraPackages.length > 0) {
        console.log(chalk.magenta("📦 Installing selected optional dependencies..."));
        const packageMap = {
            'ForgeCanvas': '@tryforge/forge.canvas',
            'ForgeDB': '@tryforge/forge.db mongodb',
            'ForgeRegex': 'https://github.com/xNickyDev/ForgeRegex'
        };
        const installPackages = answers.extraPackages.map(pkg => packageMap[pkg]).join(' ');
        execSync(`npm install ${installPackages}`, { stdio: 'inherit' });
    }

    // Generate necessary files and folders
    createFolders();
    generateIndex(answers.extraPackages);
    generateSampleCommand();

    console.log(chalk.green.bold("\n🎉 Setup complete! Run ") + chalk.blue.bold("`node index.js`") + chalk.green.bold(" to start your bot.\n"));
}

// Function to create necessary folders
function createFolders() {
    const folders = ['prefix', 'events', 'functions', 'components', 'interactions'];

    folders.forEach(folder => {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
            console.log(chalk.blue(`📁 Created folder: ${folder}`));
        }
    });
}

// Function to generate `index.js`
function generateIndex(extraPackages) {
    let imports = `
const { ForgeClient, FunctionManager, LogPriority } = require('@tryforge/forgescript');
const mongoose = require('mongoose');
const chalk = require('chalk');
require('dotenv').config();

// Optional imports
${extraPackages.includes('ForgeCanvas') ? "const { ForgeCanvas } = require('@tryforge/forge.canvas');" : ''}
${extraPackages.includes('ForgeDB') ? "const { ForgeDB } = require('@tryforge/forge.db');" : ''}
${extraPackages.includes('ForgeRegex') ? "const { ForgeRegex } = require('forge.regex');" : ''}

// Error catchers
process.on('unhandledRejection', (reason, p) => {
    (chalk.red('❌ Unhandled Rejection at Promise:'), reason, p)
})
.on('uncaughtException', err => {
    console.error(chalk.red('❌ Uncaught Exception:'), err);
    process.exit(1)
})

// Initialize ForgeClient
const client = new ForgeClient({
    events: ["voiceStateUpdate", 
        "userUpdate",
        "typingStart",
        "threadUpdate",
        "threadDelete",
        "threadMemberUpdate",
        "stickerDelete",
        "stickerUpdate",
        "threadCreate",
        "shardResume",
        "stageInstanceCreate",
        "stageInstanceDelete",
        "stageInstanceUpdate",
        "stickerCreate",
        "shardReconnecting",
        "shardReady",
        "shardError",
        "shardDisconnect",
        "roleUpdate",
        "roleDelete",
        "messageReactionRemoveEmoji",
        "messageUpdate",
        "presenceUpdate",
        "ready",
        "roleCreate",
        "messageReactionRemoveAll",
        "messageReactionRemove",
        "messageReactionAdd",
        "messagePollVoteRemove",
        "messageDelete",
        "messageCreate",
        "messageDeleteBulk",
        "messagePollVoteAdd",
        "guildUpdate",
        "interactionCreate",
        "inviteCreate",
        "inviteDelete",
        "guildScheduledEventDelete",
        "guildScheduledEventUpdate",
        "guildScheduledEventUserRemove",
        "guildScheduledEventUserAdd",
        "guildUnavailable",
        "guildMemberAvailable",
        "guildMemberRemove",
        "guildMemberUpdate",
        "guildScheduledEventCreate",
        "guildBanRemove",
        "guildCreate",
        "guildDelete",
        "guildMemberAdd",
        "guildBanAdd",
        "guildAvailable",
        "guildAuditLogEntryCreate",
        "error",
        "emojiUpdate",
        "entitlementCreate",
        "entitlementDelete",
        "entitlementUpdate",
        "emojiDelete",
        "emojiCreate",
        "channelPinsUpdate",
        "channelUpdate",
        "debug",
        "channelCreate",
        "channelDelete",
        "autoModerationRuleUpdate",
        "autoModerationRuleDelete",
        "autoModerationRuleCreate",
        "autoModerationActionExecution"],
        
    extensions: [
        
        
        
    ],
    intents: ["Guilds","GuildMembers","GuildModeration","GuildEmojisAndStickers","GuildIntegrations","GuildWebhooks","GuildInvites","GuildVoiceStates","GuildPresences","GuildMessages","GuildMessageReactions","GuildMessageTyping","DirectMessages","DirectMessageReactions","DirectMessageTyping","MessageContent","GuildScheduledEvents","AutoModerationConfiguration","AutoModerationExecution"],
    logLevel: LogPriority.None,
    prefixes: ['<@$clientID>', '<@!$clientID>', 'process.env.prefix'],
    token: process.env.TOKEN
});
console.log(chalk.green("✅ 70 Events Loaded."));
console.log(chalk.green("✅ 19 Intents Loaded."));

// Load commands and events
client.applicationCommands.load('./interactions');
console.log(chalk.green("✅ Slash commands Loaded."));
client.commands.load('./prefix');
console.log(chalk.green("✅ Prefix commands Loaded."));
client.commands.load('./events');
console.log(chalk.green("✅ Event commands Loaded."));
client.commands.load('./components');
console.log(chalk.green("✅ Components commands Loaded."));

// Loading animation
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']; 
let i = 0;

const spinner = setInterval(() => {
    process.stdout.write(\`\\r\${chalk.blue(frames[i % frames.length])} \${chalk.cyan('Starting bot...')}\`);
    i++;
}, 100);

setTimeout(() => {
    clearInterval(spinner);
    console.log(\`\\r\${chalk.green('✔')} \${chalk.bold.green('Bot started successfully!')}\`);
}, 3000);

// Start bot
client.login();
`;

    fs.writeFileSync('index.js', imports);
    console.log(chalk.green("✅ `index.js` file generated with optional extensions.\n"));
}

// Function to generate a sample command
function generateSampleCommand() {
    const prefixcommandContent = `
    module.exports = {
        name: "ping",
        description: "Replies with Pong!",
        type: "messageCreate",
        code: \`🏓 Pong!\`
    };`;
    
    fs.writeFileSync('prefix/ping.js', prefixcommandContent);
    console.log(chalk.green("✅ Sample command `ping.js` created in `commands/`.\n"));
const slashcommandContent = `
    module.exports = {
    data: {
        name: "ping",
        description: "Replies with Pong!",
        },
        code: \`$interactionReply Pong!\`};`;
    fs.writeFileSync('interactions/ping.js', slashcommandContent);
    console.log(chalk.green("✅ Sample command `ping.js` created in `interactions/`.\n"));
}

// Run setup
setup();
