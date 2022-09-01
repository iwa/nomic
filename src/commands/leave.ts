import Bot from '../Client';
import { CommandInteraction, GuildMember } from 'discord.js';
import Command from '../structures/Command';
import { getVoiceConnection } from '@discordjs/voice';

export default new class LeaveCommand extends Command {

    public constructor() {
        super('leave', LeaveVC, 1, [], ['EmbedLinks'], 'leave', "Leave the VC");
    }

};

async function LeaveVC(interaction: CommandInteraction) {
    let voiceConnection = getVoiceConnection(interaction.guildId);

    if (!voiceConnection) {
        interaction.reply({
            embeds: [Bot.createEmbed(null, ":x: I'm not connected anywhere!")],
            ephemeral: true
        });
        return;
    } else {
        try {
            Bot.players.get(interaction.guildId).stop();
            voiceConnection.destroy();
            Bot.currentTC.delete(interaction.guildId);

            interaction.reply({
                embeds: [Bot.createEmbed(null, ":door: Left the VC.")],
                ephemeral: true
            });
        } catch (e) {
            interaction.reply({
                embeds: [Bot.createEmbed(null, ":x: Failed to leave the voice channel!")],
                ephemeral: true
            });
        }

        Bot.log.info({ msg: 'leave', author: { id: interaction.user.id, name: interaction.user.tag }, guild: { id: interaction.guild.id, name: interaction.guild.name } });
    }
}