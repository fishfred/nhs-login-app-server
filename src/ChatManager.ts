import { RedisClient } from "redis";
import { Environment } from "./EnvironmentManager";
import { TokenManager } from "./TokenManager";

interface ChatInfo {
    gp: GPUser,
    patient: User,
}

interface User {
    name: string,
    nhsNumber: string
}

interface GPUser {
    name: string,
    location: string,
    image: string,
    id: String
}

export type MessageType = "text" | "image"

export interface Message {
    type: MessageType,
    data: string,
    time: number
}

export class ChatManager {
    db: RedisClient;
    constructor(redisClient: RedisClient){
        this.db = redisClient;
    }

    async getGpIdsWhichMessageUser(nhsNumber: string): Promise<string[]>{
        const gpPatients = await this.scan("0", "gp:*:patients");
        
        const gps =  await Promise.all(gpPatients.map((setKey) => {
            return new Promise<string|undefined>((resolve, reject)=>{
                this.db.sismember(setKey, nhsNumber, (err, res)=>{
                    if (err){
                        console.log(err);
                        resolve(undefined);
                    }
                    if (res == 1){
                        resolve(setKey.replace(":patients", ""));
                    }
                });
            });
        }));
        return gps.filter((g) => g !== undefined);
    }

    async getChatsByIdToken(idToken: string, env: Environment): Promise<ChatInfo[]> {
        const nhsNumber = await TokenManager.instance.verifyToken(idToken, env);
        if (!nhsNumber){
            return [];
        }
        const gps = await this.getGpIdsWhichMessageUser(nhsNumber);
        const gpDetails = await Promise.all(gps.map((g) => this.getGpProfileFromId(g)));

        const chats = gpDetails.map((gp) => {
            return {
                gp,
                patient: {
                    name: "test",
                    nhsNumber
                }
            }
        });
        return chats;
    }

    async getGpProfileFromId(id: string): Promise<GPUser|undefined>{
        console.log("getGpProfileFromId " + id);
        if (!id){
            return;
        }
        id = id.replace("gp:", "");
        const info = await new Promise<string>((resolve, reject) => {
            this.db.get("gp:" + id, (err, res) => {
                if (err){
                    console.log(err);
                }
                resolve(res);
            })
        }).then((res) => JSON.parse(res));
        const {name, location} = info;
        const image = await new Promise<string>((resolve, reject) => {
            this.db.get("gp:" + id + ":image", (err, res) => {
                if (err){
                    console.log(err);
                }
                resolve(res);
            })
        });
        return {
            id,
            image,
            name,
            location
        }
    }

    async getChatMessages(idToken: string, environment: Environment, uid: string): Promise<{
        gpToPatient: Message[],
        patientToGp: Message[]
    }> {
        const nhsNumber = await TokenManager.instance.verifyToken(idToken, environment);
        return {
            patientToGp: await this.getMessagesFromList("messages:" + nhsNumber + ":" + uid),
            gpToPatient: await this.getMessagesFromList("messages:" + uid + ":" + nhsNumber),
        }
    }

    async getMessagesFromList(key: string): Promise<Message[]> {
        console.log("Getting messages from list " + key);
        return new Promise<Message[]>((resolve, reject) => {
            this.db.lrange(key, 0, 20, (err, res) => {
                if (err){
                    reject(err);
                    return;
                }
                resolve(res.map((r) => JSON.parse(r) as Message));
            });
        });
    }

    async userCanMessageGp(nhsNumber: string, gpId: string): Promise<boolean>{
        return (await this.getGpIdsWhichMessageUser(nhsNumber)).indexOf(gpId) !== -1;
    }

    async sendMessage(idToken: string, environment: Environment, uid: string, message: string, messageType: MessageType): Promise<Message> {
        const nhsNumber = await TokenManager.instance.verifyToken(idToken, environment);
        if (!this.userCanMessageGp(nhsNumber, uid)){
            console.warn(`User ${nhsNumber} is not authorized to message gp ${uid}`);
            return;
        }
        const msgObj: Message = {
            data: message,
            type: messageType,
            time: Date.now()
        }
        return new Promise<Message>((resolve, reject) => {
            this.db.lpush(`messages:${nhsNumber}:${uid}`, JSON.stringify(msgObj), (err, res) => {
                if (err){
                    reject(err);
                }
                else {
                    resolve(msgObj);
                }
            });
        })
    }

    async scan(cursor: string, pattern: string): Promise<string[]>{
        console.log(`SCAN ${cursor} MATCH ${pattern}`);
        return new Promise((resolve, reject) => {
            this.db.scan(cursor, "MATCH", pattern, async (err, [newCursor, res]) => {
                if (err){
                    console.log(err);
                }
                const returnList: string[] = [];
                res.forEach((key) => {
                    console.log(key);
                    returnList.push(key);
                });
                if (newCursor !== "0"){
                    let newList = await this.scan(newCursor, pattern);
                    returnList.concat(newList);
                }
                resolve(returnList);
            })
        })
        
    }
}