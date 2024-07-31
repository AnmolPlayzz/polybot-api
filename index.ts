import dotenv from "dotenv";
dotenv.config();
const PORT: number = Number(process.env.PORT) || 3000;
const TOKEN: string | undefined = process.env.TOKEN;
if (!TOKEN) {
    throw new Error("No token found!")
}
import express, {Express, Request, Response} from "express";
import {Client, GatewayIntentBits, Guild, Snowflake, ChannelType} from "discord.js";
const client: Client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});
const app: Express = express();
app.use(express.json());

app.post("/server",async (req: Request, res: Response) => {
    const { id }: {
        id: Snowflake | undefined
    } = req.body;
    if (!id) return res.status(403).json({
        error: "No ID found!"
    })
    try {
        const server: Guild = await client.guilds.fetch(id)
        const name: string = server.name;
        const iconUrl: string | null = server.iconURL()
        const memberCount: number = server.memberCount;
        const botCount: number = (await server.members.fetch()).filter(m => m.user.bot).size
        const roleCount: number = (await server.roles.fetch()).size
        const channelCount: number = (await server.channels.fetch()).size
        res.status(200).json({
            id,
            name,
            iconUrl,
            memberCount,
            botCount,
            roleCount,
            channelCount,
        })
    } catch (e: any) {
        console.error(e)
        res.status(500).json({
            error: e.message,
        })
    }
})

app.post("/channels", async (req: Request, res: Response) => {
    const { guildId, channelType }: {
        guildId: Snowflake | undefined,
        channelType:  ChannelType.GuildCategory | ChannelType.GuildAnnouncement | ChannelType.GuildStageVoice | ChannelType.GuildText | ChannelType.GuildVoice | ChannelType.GuildForum | ChannelType.GuildMedia | undefined,
    } = req.body;
    /*
    Nomenclature
    - category: 4
    - announcement: 5
    - text: 0
    - forum: 15
    - stage: 13
    - voice: 2
    - thread (public): 12
    - thread (private): 11
    */

    if (!guildId) return res.status(403).json({
        error: "No ID found!"
    })
    if (!channelType) return res.status(403).json({
        error: "No channel type found!"
    })
    try {
        const server: Guild = await client.guilds.fetch(guildId);
        const channels = (await server.channels.fetch()).filter(channel => {
            if(channel) {
                return channel.type==channelType
            }
        })
        const mappedChannels = channels.map(channel => {
            if(channel) {
                return {
                    id: channel.id,
                    name: channel.name,
                    type: channel.type
                }
            }
        })
        res.status(200).json({
            id: guildId,
            channels: mappedChannels,
        })
    } catch (e) {
        console.error(e)
    }
})

app.post("/roles", async (req: Request, res: Response) => {
    const { guildId }: {
        guildId: Snowflake | undefined,
    } = req.body;

    if (!guildId) return res.status(403).json({
        error: "No ID found!"
    })

    try {
        const server: Guild = await client.guilds.fetch(guildId);
        const roles = (await server.roles.fetch()).filter(role => {
            if(role) {
                return !role.managed && role.name!=="@everyone"
            }
        })
        const mappedRoles = roles.map(role => {
            if(role) {
                return {
                    id: role.id,
                    name: role.name,
                    color: role.color
                }
            }
        })
        res.status(200).json({
            "id": guildId,
            "roles": mappedRoles,
        })
    } catch (e) {
        console.error(e)
    }
})

client.on("ready", async () => {
    console.log("Discord.JS client ready!")
})

client.login(TOKEN)

app.listen(PORT, () => {
    console.log("Server running at PORT: ", PORT);
    console.log(`Address: http://localhost:${PORT}`)
}).on("error", (error) => {
    throw new Error(error.message);
});
