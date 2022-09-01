import Bot from '../Client';
import { CommandInteraction } from 'discord.js';
import Command from '../structures/Command';

export default new class PingCommand extends Command {

    public constructor() {
        super('ping', SendPing, 0, [], ['EmbedLinks'], 'ping', "Pong!");
    }

};

async function SendPing(interaction: CommandInteraction) {
    let ping = Math.ceil(Bot.ws.ping);
    await interaction.reply({
        embeds: [Bot.createEmbed(null, `:ping_pong: Pong ! \`${ping}ms\``)]
    })
        .then(() => { Bot.log.info({ msg: 'ping', author: { id: interaction.user.id, name: interaction.user.tag }, guild: { id: interaction.guild.id, name: interaction.guild.name } }); })
        .catch(err => Bot.log.error(err));
}