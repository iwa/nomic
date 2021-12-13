import Bot from '../Client'
import { CommandInteraction } from 'discord.js';
import Command from '../structures/Command';

export default new class SetupCommand extends Command {

    public constructor() {
        super('setup', SetupVC, 1, [], ['EMBED_LINKS'], 'setup', "Setup the TTS Text channel for the bot");
    }

}

async function SetupVC(interaction: CommandInteraction) {
    Bot.currentVC = interaction.channelId;

    await interaction.reply({
        embeds: [Bot.createEmbed(null, `:white_check_mark: TTS Channel set to this text channel!`)],
        ephemeral: true
    })
        .then(() => { Bot.log.info({ msg: 'setup', author: { id: interaction.user.id, name: interaction.user.tag }, guild: { id: interaction.guild.id, name: interaction.guild.name } }); })
        .catch(err => Bot.log.error(err));
}