import express from "express";
import {Server} from "http";
import * as sio from "socket.io";
import redis from "redis";

import {OpenID} from "./openid";
import {TokenManager} from "./TokenManager";
import {EnvironmentManager} from "./EnvironmentManager";
import { ChatManager } from "./ChatManager";

// Create Express server
const app = express();
const http = new Server(app);
const io = new sio.Server(http);
const redisClient = redis.createClient(process.env.REDIS_URL ? process.env.REDIS_URL : undefined);
const oid = new OpenID();
const tokenManager = new TokenManager(redisClient);
const environmentManager = new EnvironmentManager();
const chatManager = new ChatManager(redisClient);

let MESSAGING_ENABLED = true;

redisClient.on("error", (error) => {
    if (error.code == "ECONNREFUSED"){
        console.warn("WARNING: Could not connect to redis instance. Make sure it has been started.");
        console.log("No redis instance. Disabling messaging functionality");
        redisClient.quit(() => {});
        MESSAGING_ENABLED = false;
        return;
    }
    console.log(error);
});

app.get("/env", (req, res) => {
    res.status(200).json({
        envs: environmentManager.getEnvironments().map((env) => {
            return {
                name: env.name,
                url: env.url,
                client_id: env.clientId
            }
        })
    })
});

app.get("/chat/:id", async (req, res) => {
    // Get all messages in a given chat
    const token = req.headers.authorization.replace("Bearer ", "");
    console.log(token);
    const env = req.query.env as string;
    console.log(`/chat/${req.params.id} ${env}`);
    const messages = await chatManager.getChatMessages(token, environmentManager.getEnvironmentByName(env), req.params.id);
    console.log(messages);
    res.status(200).json(messages);
});

app.get("/chats", async (req, res) => {
    // Get list of user's chats
    const token = req.headers.authorization.replace("Bearer ", "");
    const env = req.query.env as string;
    const chats = await chatManager.getChatsByIdToken(token, environmentManager.getEnvironmentByName(env));
    res.status(200).json({
        chats
    });
});

//@ts-ignore
let ws;

app.get("/message", async (req, res) => {
    const m = {
        data: "Hi",
        time: Date.now(),
        type: "text",
    };
    //@ts-ignore
    ws.emit("message:text", m, true);
});

io.on("connection", async (socket: sio.Socket) => {
    console.log("new socket.io connection")
    const idToken = socket.handshake.auth.token;
    const envName = socket.handshake.query.env as string;
    const env = EnvironmentManager.instance.getEnvironmentByName(envName);
    const nhsNumber = await tokenManager.verifyToken(idToken, env);
    if (!nhsNumber){
        socket.emit("error", {
            error: "Invalid token"
        });
    }

    socket.emit("connected");
    ws = socket;

    // New user connected
    socket.on("message:text", async (data) => {
        const {chatid, text} = data;
        console.log(`message ${chatid} ${text}`)
        const msg = await chatManager.sendMessage(idToken, env, chatid, text, "text");
        socket.emit("message:text", msg, false);
    })
})

app.get("/code", (req, res) => {
    if (!req.query.code){
        res.redirect("com.dunhslogin://oauth?code=undefined")
        return;
    }
    res.redirect("com.dunhslogin://oauth?code="+req.query.code);
});

app.post("/token", async (req, res) => {
    const {env, code} = req.query;
    if (!env) {
        res.status(400).json({
            error: "Invalid request"
        });
        return;
    }
    const environment = environmentManager.getEnvironmentByName(env as string);
    if (!environment){
        res.status(400).json({
            error: `Environment ${env} not found`
        });
        return;
    }
    //@ts-ignore
    const {idToken, nhsAccessToken, idTokenPayload} = await oid.requestAccessToken(code, environment);
    let messagingDisabledReason = "";
    let accessToken = "";
    if (!idTokenPayload.nhs_number){
        messagingDisabledReason = "Profile scope not selected."
    }
    else {
        tokenManager.storeNhsAccessToken(nhsAccessToken, idTokenPayload.nhs_number);
        accessToken = tokenManager.generateToken(idTokenPayload.nhs_number, environment);
    }
    res.json({
        id_token: idToken,
        messaging_enabled: MESSAGING_ENABLED && messagingDisabledReason == "",
        messaging_disabled_reason: messagingDisabledReason,
        access_token: accessToken,
        nhs_access_token: nhsAccessToken
    });
})

if (process.env.JEST_WORKER_ID === undefined) {
    const PORT = process.env.PORT || 3000;
    http.listen(PORT, () => {
        console.log("App listening on port " + PORT);
    });
}

export default app;
