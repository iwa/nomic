import { EmbedBuilder } from 'discord.js';

const COLOR = "#2F3136";

export default function createEmbed(title?: string, desc?: string, footer?: string, author?: { name: string, url?: string; }, thumbnail?: string) {
    const embed = new EmbedBuilder()
        .setColor(COLOR);

    if (title)
        embed.setTitle(title);

    if (desc)
        embed.setDescription(desc);

    if (footer)
        embed.setFooter({ text: footer });

    if (author)
        embed.setAuthor({ name: author.name, url: author.url });

    if (thumbnail)
        embed.setThumbnail(thumbnail);

    return embed;
}