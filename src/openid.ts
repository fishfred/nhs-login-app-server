import { Request } from 'express';
import * as jwt from "jsonwebtoken";
import { readFileSync } from "fs";
import { v1 as uuidv1 } from "uuid";
import { stringify } from "querystring";
import axios from "axios";
import { Environment, EnvironmentManager } from './EnvironmentManager';

const openIdConfig = {
    REDIRECT_URI: "https://du-nhs-login.herokuapp.com/code",
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

export class OpenID {
    constructor() {

    }

    async requestAccessToken(code: string, environment: Environment): Promise<{
        idToken: NhsUserInfo,
        nhsAccessToken: string,
        idTokenPayload: any
    }> {
        // return new Promise((resolve, reject)=>{
        //     resolve(exampleUser);
        // });
        const post_data = {
            grant_type: "authorization_code",
            code,
            redirect_uri: openIdConfig.REDIRECT_URI,
            client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            client_assertion: this.generateAssertionJWT(environment),
            client_id: environment.clientId
        }
        const post_data_string = stringify(post_data);
        console.log(post_data_string);
        const response = await axios.post(environment.url + "/token", post_data_string).catch((error) => {
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

        return {
            idToken: id_token,
            idTokenPayload: this.decodeToken(id_token),
            nhsAccessToken: access_token
        };
        // console.log(response.data);
    }

    decodeToken(token: string): any{
        return jwt.decode(token);
    }

    generateAssertionJWT(environment: Environment) {
        const signOptions: jwt.SignOptions = {
            issuer: environment.clientId,
            subject: environment.clientId,
            audience: environment.url + "/token",
            expiresIn: "30m",
            algorithm: "RS512"
        }

        return jwt.sign({ jti: uuidv1() }, environment.privateKey, signOptions);
    }
}