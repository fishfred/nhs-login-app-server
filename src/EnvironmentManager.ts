export interface PublicEnvironment {
    name: string,
    clientId: string,
    url: string
}

export type Environment = PublicEnvironment & {
    privateKey: string,
    publicKey: string
}

export class EnvironmentManager {
    static instance: EnvironmentManager;

    environments: Environment[];
    serverUrl: string;
    constructor() {
        if (EnvironmentManager.instance != undefined) {
            console.warn("EnvironmentManager instance already exists.");
        }
        EnvironmentManager.instance = this;

        this.serverUrl = process.env.SERVER_URL;
        console.log(`Server URL: ${this.serverUrl}.`);
        console.log("Enter this URL in app to connect to server.");

        this.updateEnvironmentsFromEnv();
    }

    getEnvironmentByClientId(clientId: string){
        return this.environments.find((e)=>{
            return e.clientId == clientId;
        });
    }

    getEnvironmentByName(name: string){
        return this.environments.find((e)=>{
            return e.name == name;
        });
    }

    getEnvironments(): PublicEnvironment[]{
        return this.environments.map((env) => {
            return {
                clientId: env.clientId,
                name: env.name,
                url: env.url
            }
        })
    }

    updateEnvironmentsFromEnv() {
        this.environments = [];
        console.log("Verifying Configuration");
        let i = 0;
        let vars = {
            "ENV_NAME_": "name",
            "CLIENT_ID_": "clientId",
            "PRIVATE_KEY_": "privateKey",
            "PUBLIC_KEY_": "publicKey",
            "ENV_URL_": "url"
        }
        while (process.env[`CLIENT_ID_${i}`] !== undefined) {
            let e: any = {};
            let failed = false;
            Object.entries(vars).forEach(([env_var, name]) => {
                if (process.env[env_var + i] == undefined) {
                    console.error(`Invalid environment config. ${env_var}${i} not set.`);
                    failed = true;
                    return;
                }
                e[name] = process.env[env_var + i];
            });
            if (failed) {
                i++;
                continue;
            }
            console.log(`Found environment ${i}: ${e.name}`);
            this.environments.push(e);
            i++;
        }
        if (i == 0) {
            console.error("No environments found. Server is still running but you will not be able to log in.\nSee readme.md for instructions");
        }
    }
}