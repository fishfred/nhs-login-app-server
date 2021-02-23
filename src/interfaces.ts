export interface Chat{
    id: string,
    gp: string,
    patient: string;
}

export interface Message {
    id: number,
    chat: string,
    message: string,
    image: string,
    gp: boolean
}

export interface Token {
    id: number,
    token: string,
    userid: string,
    exp: number
}

export interface User {
    id: string,
    fullname: string,
    gp: boolean,
    image: string
}

export interface Image {
    id: string,
    chat: string
}