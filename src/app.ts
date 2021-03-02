import express from "express";
import {Server} from "http";
import * as sio from "socket.io";
import redis from "redis";

import {OpenID} from "./openid";

// Create Express server
const app = express();
const http = new Server(app);
const io = new sio.Server(http);
const redisClient = redis.createClient();
const oid = new OpenID();

redisClient.on("error", (error) => {
    if (error.code == "ECONNREFUSED"){
        console.warn("WARNING: Could not connect to redis instance. Make sure it has been started.");
        console.log("No redis instance. Disabling messaging functionality");
        redisClient.quit(() => {});
        return;
    }
    console.log(error);
})

app.get("/", (req, res) => {
    res.send("Hello");
});

app.get("/env", (req, res) => {
    res.status(200).json({
        envs: [{
            name: "Sandpit",
            url: "https://auth.sandpit.signin.nhs.uk"
        }]
    })
});

app.get("/chat/:id", (req, res) => {
    // Get all messages in a given chat
});

app.get("/chats", (req, res) => {
    // Get list of user's chats
});

io.on("connection", (socket: sio.Socket) => {
    // New user connected
    socket.on("message:text", (data) => {
        const {chatid, text} = data;
        // New text message
    })
})

app.post("/code", async (req, res) => {
    console.log("Received code");
    //@ts-ignore
    const nhsUser = await oid.requestAccessToken(req.query.code);
    res.json({
        "nhsUserInfo": nhsUser
    });
});

if (process.env.JEST_WORKER_ID === undefined) {
    const PORT = process.env.PORT || 3000;
    http.listen(PORT, () => {
        console.log("App listening on port " + PORT);
    });
}

export default app;
