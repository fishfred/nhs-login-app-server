import { RedisClient } from "redis";
import * as jwt from "jsonwebtoken";
import {v1 as uuidv1} from "uuid";

import {readFileSync} from "fs";

export class TokenManager {
    db: RedisClient;
    privateKey: string;
    publicKey: string;

    constructor(database: RedisClient){
        // connect to database
        this.db = database;
        this.privateKey = process.env.PRIVATE_KEY;
        if (!this.privateKey) {
            this.privateKey = readFileSync(__dirname + "\\..\\private_key.pem", "utf-8");
        }
        this.publicKey = process.env.PUBLIC_KEY;
        if (!this.publicKey) {
            this.publicKey = readFileSync(__dirname + "\\..\\public_key.pem", "utf-8");
        }
    }

    generateToken(userid: string){
        // Generate a jwt and return it
        const signOptions: jwt.SignOptions = {
            issuer: "nhs-login-app",
            subject: userid,
            expiresIn: "30m",
            algorithm: "RS512"
        };
        return jwt.sign({jti: uuidv1()}, this.privateKey, signOptions);
    }

    verifyToken(token: string): Promise<string> {
        return new Promise((resolve, reject) => {
            jwt.verify(token, this.publicKey, (err, decoded) => {
                if (err){
                    resolve("");
                    return;
                }
                //@ts-ignore
                resolve(decoded.sub);
            });
        });
    }
}