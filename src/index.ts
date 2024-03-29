import dotenv from "dotenv";
dotenv.config();

import Bot from './Client';

import Command from './structures/Command';
import makePermsErrorBetter from "./utils/makePermsErrorBetter";
import PermLevels from "./structures/PermLevels";
import { GuildMember, TextChannel, VoiceChannel } from "discord.js";
import { createAudioResource, getVoiceConnection } from "@discordjs/voice";
import { Stream } from "stream";

// Process related Events
process.on('uncaughtException', async exception => Bot.log.error(exception));
process.on('unhandledRejection', async exception => Bot.log.error(exception));

// Bot-User related Events
Bot.on('warn', (warn) => Bot.log.warn(warn));
Bot.on('shardError', (error) => Bot.log.error(error));
Bot.on('shardDisconnect', (event) => Bot.log.debug({ msg: "bot disconnected", event: event }));
Bot.on('shardReconnecting', (event) => Bot.log.debug({ msg: "bot reconnecting", event: event }));
Bot.on('shardResume', () => { Bot.user.setStatus('idle'); });
Bot.once('shardReady', async () => {
    Bot.user.setStatus('idle');
    Bot.log.debug(`logged in as ${Bot.user.username}`);
});

// Slash commands
Bot.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    if (interaction.user.bot) return;

    let cmd: Command = Bot.commands.get(interaction.commandName);

    if (cmd) {
        if (cmd.discordPerm && !interaction.guild.members.me.permissions.has(cmd.discordPerm) && !(interaction.channel as TextChannel).permissionsFor(Bot.user).has(cmd.discordPerm)) {
            makePermsErrorBetter(interaction, cmd);
            return;
        }

        switch (cmd.permLevel) {
            case PermLevels.Iwa:
                if (interaction.user.id === process.env.IWA)
                    await cmd.run(interaction);
                break;

            case PermLevels.Mod:
                if ((interaction.member as GuildMember).permissions.has('Administrator') ||
                    (interaction.member as GuildMember).permissions.has('ManageGuild')) {
                    await cmd.run(interaction);
                } else
                    interaction.reply({
                        embeds: [Bot.createEmbed(":x: You need to have either `Admin` or `Manage Server` permission!")],
                        ephemeral: true
                    });
                break;

            case PermLevels.Everyone:
                await cmd.run(interaction);
                break;

            default:
                break;
        }
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
    if (Bot.currentTC.has(msg.guildId) && msg.channelId === Bot.currentTC.get(msg.guildId) && msg.cleanContent.length <= 1024) {
        let player = Bot.players.get(msg.guildId);

        if (player && player.state.status !== 'playing') {
            let res = await Bot.tts.synthesizeSpeech({
                OutputFormat: 'mp3',
                Text: `${msg.member.nickname ? msg.member.nickname : msg.author.username} a dit : ${msg.cleanContent}`,
                VoiceId: 'Mathieu',
                Engine: 'standard',
                LanguageCode: 'fr-FR',
                SampleRate: '24000'
            }).promise();

            if (res.AudioStream) {
                if (res.AudioStream instanceof Buffer) {
                    let stream = Stream.Readable.from(res.AudioStream);
                    let ressource = createAudioResource(stream, { inlineVolume: true });
                    ressource.volume.setVolume(0.8);
                    player.play(ressource);
                }
            }
        } else {
            msg.react('❌');
        }
    }
});


// VC Check if Bot's alone
Bot.on('voiceStateUpdate', async (oldState, newState) => {
    let channel = oldState.channel;
    if (!channel) return;

    if (oldState.id === Bot.user.id && newState.id === Bot.user.id) {
        if (!newState.channel) {
            let player = Bot.players.get(oldState.guild.id);

            if (player) {
                player.stop();
                Bot.currentTC.delete(oldState.guild.id);
            }
        }
    }

    let members = channel.members;
    if (members.size === 1) {
        if (members.has(Bot.user.id)) {
            let voiceChannel = oldState.channel;
            if (!voiceChannel) return;

            const voiceConnection = getVoiceConnection(voiceChannel.id);
            const player = Bot.players.get(voiceChannel.guild.id);

            if (voiceConnection || player) {
                setTimeout(async () => {
                    let voiceChan = await Bot.channels.fetch(voiceChannel.id);
                    if (!voiceChan) {
                        player.stop();
                        voiceConnection.destroy();
                        Bot.currentTC.delete(oldState.guild.id);
                        return;
                    }

                    if ((voiceChan as VoiceChannel).members.size === 1) {
                        player.stop();
                        voiceConnection.destroy();
                        Bot.currentTC.delete(oldState.guild.id);
                        Bot.log.info({ msg: 'auto stop', guild: { id: voiceChannel.guild.id, name: voiceChannel.guild.name } });
                    }
                }, 300000);
            }
        }
    }
});

// Login
Bot.start(process.env.TOKEN);