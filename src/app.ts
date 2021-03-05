import express from "express";
import {Server} from "http";
import * as sio from "socket.io";
import redis from "redis";

import {OpenID} from "./openid";
import {TokenManager} from "./TokenManager";

// Create Express server
const app = express();
const http = new Server(app);
const io = new sio.Server(http);
const redisClient = redis.createClient();
const oid = new OpenID();
const tokenManager = new TokenManager(redisClient);

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
            url: "https://auth.sandpit.signin.nhs.uk",
            client_id: "du-nhs-login"
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

app.get("/code", async  (req, res) => {
    //@ts-ignore
    const idToken = await oid.requestAccessToken(req.query.code);
    if (!idToken){
        res.redirect("com.dunhslogin://oauth?token=undefined")
        return;
    }
    res.redirect("com.dunhslogin://oauth?token="+idToken);
});

if (process.env.JEST_WORKER_ID === undefined) {
    const PORT = process.env.PORT || 3000;
    http.listen(PORT, () => {
        console.log("App listening on port " + PORT);
    });
}

export default app;
