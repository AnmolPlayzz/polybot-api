import dotenv from "dotenv";
dotenv.config();
const PORT: number = Number(process.env.PORT) || 3000;
const TOKEN: string | undefined = process.env.TOKEN;
if (!TOKEN) {
    throw new Error("No token found!")
}
import express, {Express, Request, Response} from "express";
import {Client, GatewayIntentBits, Guild, Snowflake} from "discord.js";

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
