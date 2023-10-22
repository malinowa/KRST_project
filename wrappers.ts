import {WebSocket} from "ws";

export enum MessageType {
    QUERY_LATEST = 0,
    QUERY_ALL = 1,
    RESPONSE_BLOCKCHAIN = 2,
    QUERY_PENDING = 3,
    RESPONSE_PENDING = 4,
    LOG_INFORMATION = 5
}

export class Message {
    type: MessageType;
    data: string;

    constructor(type: MessageType, data: string) {
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
}