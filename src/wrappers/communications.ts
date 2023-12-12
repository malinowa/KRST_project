import {WebSocket} from "ws";

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