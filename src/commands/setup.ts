import Bot from '../Client'
import { CommandInteraction } from 'discord.js';
import Command from '../structures/Command';

export default new class SetupCommand extends Command {

    public constructor() {
        super('setup', SetupVC, 0, [], ['EMBED_LINKS'], 'setup', "Setup the bot in this VC");
    }

}

async function SetupVC(interaction: CommandInteraction) {
    Bot.currentVC = interaction.channelId;

    await interaction.reply(Bot.createEmbed(null, `:white_check_mark: TTS Setup in this channel!`))
        .then(() => { Bot.log.info({ msg: 'setup', author: { id: interaction.user.id, name: interaction.user.tag }, guild: { id: interaction.guild.id, name: interaction.guild.name } }); })
        .catch(err => Bot.log.error(err));
}