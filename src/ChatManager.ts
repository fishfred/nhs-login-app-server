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

export class ChatManager {
    db: RedisClient;
    constructor(redisClient: RedisClient){
        this.db = redisClient;
    }

    async getChatsByIdToken(idToken: string, env: Environment): Promise<ChatInfo[]> {
        const nhsNumber = await TokenManager.instance.verifyToken(idToken, env);
        if (!nhsNumber){
            return [];
        }
        const gpPatients = await this.scan("0", "gp:*:patients");
        
        let gps = await Promise.all(gpPatients.map((setKey) => {
            return new Promise<string|undefined>((resolve, reject)=>{
                this.db.sismember(setKey, nhsNumber, (err, res)=>{
                    if (err){
                        console.log(err);
                    }
                    if (res == 1){
                        resolve(setKey.replace(":patients", ""));
                    }
                });
            }).then((val) => this.getGpProfileFromId(val));
        }));
        console.log(gps);
        gps = gps.filter((gp) => gp !== undefined);
        const chats = gps.map((gp) => {
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
        console.log(info);
        const {name, location} = info;
        const image = await new Promise<string>((resolve, reject) => {
            this.db.get("gp:" + id + ":image", (err, res) => {
                if (err){
                    console.log(err);
                }
                resolve(res);
            })
        });
        console.log(image);
        return {
            id,
            image,
            name,
            location
        }
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