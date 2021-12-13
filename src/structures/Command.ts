import { PermissionString } from "discord.js";
import PermLevels from "./PermLevels";

export default class Command {
    public readonly name: string;
    public readonly description: string;
    public readonly run: Function;

    public readonly permLevel: PermLevels;
    public readonly aliases: readonly string[];
    public readonly discordPerm: PermissionString[];
    public readonly usage: string;

    constructor(name: string, run: Function, permLevel: PermLevels, aliases: string[], discordPerm: PermissionString[], usage: string, desc?: string) {
        this.name = name;
        this.run = run;
        this.permLevel = permLevel;
        this.aliases = aliases || [];
        this.discordPerm = discordPerm || [];
        this.usage = usage || "?";
        this.description = desc || "No description provided.";
    }
}