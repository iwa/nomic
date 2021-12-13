import dotenv from "dotenv";
dotenv.config();

import Bot from './Client';

import Command from './structures/Command';
import makePermsErrorBetter from "./utils/makePermsErrorBetter";
import PermLevels from "./structures/PermLevels";
import { TextChannel, VoiceChannel } from "discord.js";
import { createAudioResource, getVoiceConnection } from "@discordjs/voice";
import { Stream } from "stream";

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
    if (interaction.user.bot) return;

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
    if (msg.channelId === Bot.currentVC && msg.cleanContent.length <= 1024) {
        let res = await Bot.tts.synthesizeSpeech({
            OutputFormat: 'mp3',
            Text: `${msg.member.nickname} a dit : ${msg.cleanContent}`,
            VoiceId: 'Mathieu',
            Engine: 'standard',
            LanguageCode: 'fr-FR',
            SampleRate: '24000'
        }).promise();

        if (res.AudioStream) {
            if (res.AudioStream instanceof Buffer) {
                let stream = Stream.Readable.from(res.AudioStream);
                let player = Bot.players.get(msg.guildId);
                let ressource = createAudioResource(stream, { inlineVolume: true });
                ressource.volume.setVolume(0.8);
                player.play(ressource);
            }
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

            if (player)
                player.stop();
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
                        return;
                    }

                    if ((voiceChan as VoiceChannel).members.size === 1) {
                        player.stop();
                        voiceConnection.destroy();
                        Bot.log.info({ msg: 'auto stop', guild: { id: voiceChannel.guild.id, name: voiceChannel.guild.name } })
                    }
                }, 300000);
            }
        }
    }
});

// Login
Bot.start(process.env.TOKEN);