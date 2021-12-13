import { Collection, Client, Intents } from "discord.js";
import log from './Logger';
import fs from 'fs';
import Command from "./structures/Command";
import createEmbed from "./utils/createEmbed";
import aws from 'aws-sdk'
import { AudioPlayer } from "@discordjs/voice";

export default new class Bot extends Client {

    public prefix = process.env.PREFIX;

    public log = log;

    public commands: Collection<string, Command> = new Collection();

    public players: Map<string, AudioPlayer> = new Map();

    public tts = new aws.Polly({
        credentials: {
            accessKeyId: process.env.AWS_ID,
            secretAccessKey: process.env.AWS_KEY
        },
        region: 'eu-west-3'
    });

    public currentVC: string;

    public createEmbed = createEmbed;

    public constructor() {
        super({
            retryLimit: 5,
            intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]
        });
    }

    public async fetchIwa() {
        let iwa = await this.users.fetch(process.env.IWA, { cache: true });
        return iwa;
    }

    private async _init() {
        fs.readdir('./build/commands/', { withFileTypes: true }, (error, f) => {
            if (error) return log.error(error);
            f.forEach(async (f) => {
                if (f.isDirectory()) {
                    fs.readdir(`./build/commands/${f.name}/`, (error, fi) => {
                        if (error) return log.error(error);
                        fi.forEach(async (fi) => {
                            if (!fi.endsWith(".js")) return;
                            let commande: Command = (await import(`./commands/${f.name}/${fi}`)).default;
                            this.commands.set(commande.name, commande);
                        })
                    })
                } else {
                    if (!f.name.endsWith(".js")) return;
                    let commande: Command = (await import(`./commands/${f.name}`)).default;
                    this.commands.set(commande.name, commande);
                }
            });
        });
        this.log.debug('commmands initialized');
    }

    public async start(token: string) {
        await this._init();
        await this.login(token);

        for (const command of this.commands) {
            if (process.env.NODE_ENV === 'production') {
                await this.application.commands.create({
                    name: command[1].name,
                    description: command[1].description,
                });
            } else {
                let guild = await this.guilds.fetch('776588515634708500');

                await guild.commands.create({
                    name: command[1].name,
                    description: command[1].description,
                });
            }
        }
        this.log.debug('commmands created');
    }
}