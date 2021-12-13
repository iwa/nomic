import dotenv from "dotenv";
dotenv.config();

import Bot from './Client';

import Command from './structures/Command';
import makePermsErrorBetter from "./utils/makePermsErrorBetter";
import PermLevels from "./structures/PermLevels";
import { TextChannel } from "discord.js";

// Process related Events
process.on('uncaughtException', async exception => Bot.log.error(exception));
process.on('unhandledRejection', async exception => Bot.log.error(exception));

// Bot-User related Events
Bot.on('warn', (warn) => Bot.log.warn(warn));
Bot.on('shardError', (error) => Bot.log.error(error));
Bot.on('shardDisconnect', (event) => Bot.log.debug({ msg: "iwabot disconnected", event: event }));
Bot.on('shardReconnecting', (event) => Bot.log.debug({ msg: "iwabot reconnecting", event: event }));
Bot.on('shardResume', () => { Bot.user.setStatus('idle'); });
Bot.once('shardReady', async () => {
    Bot.user.setStatus('idle');
    Bot.log.debug(`logged in as ${Bot.user.username}`);
});

// Slash commands
Bot.on('interactionCreate', async (interaction) => {

    if (!interaction.isCommand()) return;

    let cmd: Command = Bot.commands.get(interaction.commandName);

    if (cmd) {
        if (cmd.discordPerm && !interaction.guild.me.permissions.has(cmd.discordPerm) && !(interaction.channel as TextChannel).permissionsFor(Bot.user).has(cmd.discordPerm)) {
            makePermsErrorBetter(interaction, cmd);
            return;
        }

        if (cmd.permLevel == PermLevels.Iwa && interaction.user.id == process.env.IWA)
            await cmd.run(interaction);
        else if (cmd.permLevel == PermLevels.Everyone)
            await cmd.run(interaction);
    }


});

// Message Event
Bot.on('messageCreate', async (msg) => {
    if (!msg) return;
    if (msg.author.bot) return;
    if (!msg.guild) {
        Bot.log.trace({ msg: 'dm', author: { id: msg.author.id, name: msg.author.tag }, content: msg.cleanContent, attachment: msg.attachments.first() });
        return;
    }
});


// VC Check if Bot's alone
//Bot.on('voiceStateUpdate', async (oldState, newState) => {
//    let channel = oldState.channel;
//    if (!channel) return;
//
//    if (oldState.id === Bot.user.id && newState.id === Bot.user.id) {
//        if (!newState.channel) {
//            let player = Bot.music.players.get(oldState.guild.id);
//
//            if (player)
//                player.destroy();
//        }
//    }
//
//    let members = channel.members;
//    if (members.size === 1)
//        if (members.has(Bot.user.id)) {
//            let voiceChannel = oldState.channel;
//            if (!voiceChannel) return;
//
//            const player = Bot.music.players.get(voiceChannel.guild.id);
//
//            if (player) {
//                setTimeout(async () => {
//                    let voiceChan = await Bot.channels.fetch(player.voiceChannel);
//                    if (!voiceChan) return player.destroy();
//
//                    if ((voiceChan as VoiceChannel).members.size === 1) {
//                        player.destroy();
//                        Bot.log.info({ msg: 'auto stop', guild: { id: voiceChannel.guild.id, name: voiceChannel.guild.name } })
//                    }
//                }, 300000);
//            }
//        }
//});

// VC Region Update
//Bot.on('channelUpdate', async (oldChannel: VoiceChannel, newChannel: VoiceChannel) => {
//    if (oldChannel.type === 'GUILD_VOICE' && newChannel.type === 'GUILD_VOICE') {
//        let player = Bot.music.players.get(newChannel.guild.id);
//
//        if (player) {
//            if (player.voiceChannel === newChannel.id) {
//                if (player.playing && !player.paused) {
//                    player.pause(true);
//                    setTimeout(() => {
//                        player.pause(false);
//                    }, 500);
//                }
//            }
//        }
//    }
//});


// Login
Bot.start(process.env.TOKEN);