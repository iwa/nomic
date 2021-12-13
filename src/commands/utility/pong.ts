import Bot from '../../Client'
import { CommandInteraction } from 'discord.js';
import Command from '../../structures/Command';

export default new class PongCommand extends Command {

    public constructor() {
        super('pong', SendPong, 0, [], ['EMBED_LINKS'], 'pong', "Ping!");
    }

}

async function SendPong(interaction: CommandInteraction) {
    let ping = Math.ceil(Bot.ws.ping);
    await interaction.reply(Bot.createEmbed(null, `:ping_pong: Ping ! \`${ping}ms\``))
        .then(() => { Bot.log.info({ msg: 'ping', author: { id: interaction.user.id, name: interaction.user.tag }, guild: { id: interaction.guild.id, name: interaction.guild.name } }); })
        .catch(err => Bot.log.error(err));
}