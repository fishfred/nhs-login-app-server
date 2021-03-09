# nhs-login-app-server

## Setup
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
1. Hit the deploy button above to create a heroku instance (or clone the repository to the server)
2. Set up according to the guide [here](https://nhsconnect.github.io/nhslogin/integrating-to-sandpit/)
    - You will need your client id and the public and private keys you generated.

## Configuration with Heroku
Heroku configuration is managed by [config vars](https://devcenter.heroku.com/articles/config-vars) (environment variables).
These are set as follows:

| name | Description |
| --- | --- |
| `ENV_NAME_X` | Name for environment `X` displayed in app |
| `CLIENT_ID_X` | Client ID of environment `X` |
| `PRIVATE_KEY_X` | Private key for environment `X` |
| `PUBLIC_KEY_X` | Public key for environement `X` |
| `ENV_URL_X` | Base URL for environment `X` |

### Example configuration
`ENV_NAME_0` = `sandpit`

`CLIENT_ID_0` = `du-nhs-login`

`PRIVATE_KEY_0` = 
```
-----BEGIN PRIVATE KEY-----
<private key>
-----END PRIVATE KEY-----
```

`PUBLIC_KEY_0` = 
```
-----BEGIN PUBLIC KEY-----
<public key>
-----END PUBLIC KEY-----
```

`ENV_URL_0` = `https://auth.sandpit.signin.nhs.uk`

to add another enviroment, just add `ENV_NAME_1`, `CLIENT_ID_1` etc.
