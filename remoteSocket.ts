import {WebSocket} from "ws";

export class RemoteSocket {
    address: string;
    port: number;
    webSocket: WebSocket
    
    constructor(address: string,  port: number, webSocket: WebSocket) {
        this.address = address;
        this.port = port;
        this.webSocket = webSocket;
    }
    
    getSocketAddress = (): string => this.address + ":" + this.port;
}