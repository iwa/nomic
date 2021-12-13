import Bot from '../Client'
import { CommandInteraction, GuildMember } from 'discord.js';
import Command from '../structures/Command';
import { createAudioPlayer, joinVoiceChannel } from '@discordjs/voice';

export default new class JoinCommand extends Command {

    public constructor() {
        super('join', JoinVC, 0, [], ['EMBED_LINKS'], 'join', "Join the VC you're in");
    }

}

async function JoinVC(interaction: CommandInteraction) {
    let voiceChannel = (interaction.member as GuildMember).voice.channel;
    if (!voiceChannel) {
        interaction.reply({
            embeds: [Bot.createEmbed(null, ":x: You're not in a voice channel!")],
            ephemeral: true
        });
        return;
    } else {
        if (voiceChannel.type === "GUILD_VOICE") {
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

                interaction.reply({
                    embeds: [Bot.createEmbed(null, "Joined the voice channel!")],
                    ephemeral: true
                });
            } catch (e) {
                interaction.reply({
                    embeds: [Bot.createEmbed(null, "Failed to join the voice channel!")],
                    ephemeral: true
                });
            }
        }

        Bot.log.info({ msg: 'join', author: { id: interaction.user.id, name: interaction.user.tag }, guild: { id: interaction.guild.id, name: interaction.guild.name } });
    }
}