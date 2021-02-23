import express from "express";
import {Server} from "http";
import * as sio from "socket.io";
import redis from "redis";

// Create Express server
const app = express();
const http = new Server(app);
const io = new sio.Server(http);
const redisClient = redis.createClient();

redisClient.on("error", (error) => {
    console.log(error);
})

app.get("/", (req, res) => {
    res.send("Hello");
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

app.post("/code", (req, res) => {
    // Post authorisation code
});

if (process.env.JEST_WORKER_ID === undefined) {
    http.listen(8081, () => {
        console.log("App listening on port 8081");
    });
}

export default app;
