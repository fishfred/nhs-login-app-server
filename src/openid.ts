import { Request } from 'express';
import * as jwt from "jsonwebtoken";
import { readFileSync } from "fs";
import { v1 as uuidv1 } from "uuid";
import { stringify } from "querystring";
import axios from "axios";

const openIdConfig = {
    CLIENT_ID: "du-nhs-login",
    REDIRECT_URI: "https://du-nhs-login.herokuapp.com/code",
    ENV_URI: "https://auth.sandpit.signin.nhs.uk",
    TOKEN_URI: "https://auth.sandpit.signin.nhs.uk/token"
}

export interface NhsTokenResponse {
    access_token: string,
    token_type: string,
    refresh_token?: string,
    expires_in?: string,
    scope: string,
    id_token: string
}

export interface NhsTokenError {
    error: string,
    error_description?: string,
    error_uri?: string
}

export interface NhsLoginIdToken {
    iss: string,
    sub: string,
    aud: string,
    exp: string,
    iat: string,
    jti: string,
    auth_time?: string,
    nonce?: string,
    vot: string,
    vtm: string,
    family_name?: string,
    birthdate: string,
    nhs_number?: string,
    identity_proofing_level?: string
}

export interface NhsUserInfo {
    iss: string,
    aud: string,
    sub: string,
    family_name?: string,
    given_name?: string,
    email?: string,
    email_verified?: boolean,
    phone_number?: string
    phone_number_verified?: boolean,
    birthdate?: string,
    nhs_number?: string,
    gp_integration_credentials?: {
        gp_user_id: string,
        gp_linkage_key: string,
        gp_ods_code: string,
    },
    gp_registration_details?: any,
    client_user_metadata?: string,
    identity_proofing_level?: string
}

const exampleUser: NhsUserInfo = {
    iss: openIdConfig.ENV_URI,
    aud: openIdConfig.CLIENT_ID,
    sub: "24400320-234545-234241-111",
    client_user_metadata: "U2e3rsdjwd==",
    email: "janedoe@example.com",
    email_verified: true,
    nhs_number: "8527685222",
    family_name: "Doe",
    given_name: "Jane",
    identity_proofing_level: "P9",
    gp_integration_credentials: {
        gp_user_id: "32498239048-3248734",
        gp_linkage_key: "dfje2rkjdfkjdfm",
        gp_ods_code: "A12344"
    }
}

export class OpenID {
    constructor() {

    }

    async requestAccessToken(code: string): Promise<NhsUserInfo> {
        // return new Promise((resolve, reject)=>{
        //     resolve(exampleUser);
        // });
        const post_data = {
            grant_type: "authorization_code",
            code,
            redirect_uri: openIdConfig.REDIRECT_URI,
            client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            client_assertion: this.generateAssertionJWT(openIdConfig.TOKEN_URI, openIdConfig.CLIENT_ID),
            client_id: openIdConfig.CLIENT_ID
        }
        const post_data_string = stringify(post_data);
        console.log(post_data_string);
        const response = await axios.post(openIdConfig.TOKEN_URI, post_data_string).catch((error) => {
            console.log(error);
            if (error.response) {
                console.log(error.response.data);
            }
        });
        // console.log(response);
        if (!response) {
            return;
        }
        const {access_token, id_token, refresh_token} = response.data;

        return id_token;
        // console.log(response.data);
    }

    generateAssertionJWT(tokenUri: string, clientId: string) {
        let privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            privateKey = readFileSync(__dirname + "\\..\\private_key.pem", "utf-8");
        }
        const signOptions: jwt.SignOptions = {
            issuer: clientId,
            subject: clientId,
            audience: tokenUri,
            expiresIn: "30m",
            algorithm: "RS512"
        }

        return jwt.sign({ jti: uuidv1() }, privateKey, signOptions);
    }
}