import Bot from '../Client';
import { ChannelType, CommandInteraction, GuildMember } from 'discord.js';
import Command from '../structures/Command';
import { createAudioPlayer, joinVoiceChannel } from '@discordjs/voice';

export default new class JoinCommand extends Command {

    public constructor() {
        super('join', JoinVC, 0, [], ['EmbedLinks'], 'join', "Join the VC you're in");
    }

};

async function JoinVC(interaction: CommandInteraction) {
    let voiceChannel = (interaction.member as GuildMember).voice.channel;
    if (!voiceChannel) {
        interaction.reply({
            embeds: [Bot.createEmbed(null, ":x: You're not in a voice channel!")],
            ephemeral: true
        });
        return;
    } else {
        if (voiceChannel.type === ChannelType.GuildVoice) {
            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guildId,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                    selfDeaf: true,
                });

                const player = createAudioPlayer();
                Bot.players.set(interaction.guildId, player);

                player.on('error', error => {
                    Bot.log.error('Error:', error.message, 'with track', error.resource);
                });

                connection.subscribe(player);

                Bot.currentTC.set(interaction.guildId, interaction.channelId);

                interaction.reply({
                    embeds: [Bot.createEmbed(null, `:wave: Joined the voice channel and bound to \`${voiceChannel.name}\`!`)],
                    ephemeral: false
                });
            } catch (e) {
                Bot.log.error(e);
                interaction.reply({
                    embeds: [Bot.createEmbed(null, ":x: Failed to join the voice channel!")],
                    ephemeral: true
                });
            }
        }

        Bot.log.info({ msg: 'join', author: { id: interaction.user.id, name: interaction.user.tag }, guild: { id: interaction.guild.id, name: interaction.guild.name } });
    }
}