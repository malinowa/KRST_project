import {WebSocket} from "ws";
import {ec} from "elliptic";

export enum MessageType {
    LOG_INFORMATION = 1,
    VERIFICATION_REQUEST = 2,
    VERIFICATION_RESPONSE = 3
}

export class Message {
    type: MessageType;
    data: string | boolean | Identity;

    constructor(type: MessageType, data: string | boolean | Identity) {
        this.type = type;
        this.data = data;
    }
}

export class RemoteSocket {
    address: string;
    port: number;
    webSocket: WebSocket

    constructor(address: string, port: number, webSocket: WebSocket) {
        this.address = address;
        this.port = port;
        this.webSocket = webSocket;
    }


    getSocketAddress = (): string => this.address + ":" + this.port;
}

export class NewPeer {
    httpPort: number;
    p2pAddress: string;
    p2pPort: number;

    constructor(httpPort: number, p2pAddress: string, p2pPort: number) {
        this.httpPort = httpPort;
        this.p2pAddress = p2pAddress;
        this.p2pPort = p2pPort;
    }

    toWebSocketUrl(): string[] {
        return [`ws://${this.p2pAddress}:${this.p2pPort}`]
    }
}

export class P2PResponse {
    host: string | undefined;
    port: number | undefined;

    constructor(host: string | undefined, port: number | undefined) {
        this.host = host;
        this.port = port;
    }
}

export class Identity {
    message: string;
    signature: ec.Signature;
    publicKey: string;

    constructor(message: string, signature: ec.Signature, publicKey: string) {
        this.message = message;
        this.signature = signature;
        this.publicKey = publicKey;
    }
}