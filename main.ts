import express, {Express, Request, Response} from 'express';
import bodyParser from "body-parser"
import {Server, WebSocket} from "ws"
import dotenv from 'dotenv';
import colorizer from "json-colorizer";

import {RemoteSocket} from "./remoteSocket";
import {Message, MessageType} from "./message";
import {NewPeer} from "./newPeer";

dotenv.config();

const httpPort: number = Number(process.env.HTTP_PORT) || 3001;
const p2pPort: number = Number(process.env.P2P_PORT) || 6001;
const initialPeers: string[] = process.env.PEERS ? process.env.PEERS.split(",") : [];
const sockets: RemoteSocket[] = new Array<RemoteSocket>();
let wsServer: Server;
let wsClientPort: number;

function initHttpServer(): void {
    const app: Express = express();
    app.use(bodyParser.json());

    app.get("/peers", (_: Request, res: Response) => {
        const responseData: string[] = sockets.map((s) => s.getSocketAddress());
        res.send(responseData);
        console.log("Peers: " + colorizer(JSON.stringify(responseData)));
    });

    app.post("/addPeer", (req: Request<{}, {}, NewPeer>, res: Response) => {
        connectToPeers([`ws://${req.body.p2pAddress}:${req.body.p2pPort}`]);
        res.send();
    });

    app.get("/p2p", (_: Request, res: Response) => {
        res.send(JSON.stringify({host: wsServer.options.host, port: wsServer.options.port}));
        console.log("P2P Server: " + colorizer(JSON.stringify({
            host: wsServer.options.host,
            port: wsServer.options.port
        })));
    });

    app.listen(httpPort, () => console.log("Listening HTTP on port: " + httpPort));
}

function initP2PServer() {
    wsServer = new WebSocket.Server({port: p2pPort});
    wsServer.on("connection",
        (ws: WebSocket) => {
            // @ts-ignore
            console.log("Connection event fired!", ws._socket.remoteAddress, ws._socket.remotePort);
            // @ts-ignore
            return initConnection(ws, ws._socket.remoteAddress, ws._socket.remotePort)
        });
    console.log("Listening P2P on port: " + p2pPort);
}

function initConnection(webSocket: WebSocket, address: string, port: number) {
    // console.log("initConnection method called", address, port);
    // let socket = new RemoteSocket(address, port, webSocket);
    // if (socketAlreadyExists(socket)) {
    //     return;
    // }

    // sockets.push(socket);
    initMessageHandler(webSocket);
    initErrorHandler(webSocket);
    // write(webSocket, {message: "initializedConnection", from: socket.getSocketAddress()});
}

function socketAlreadyExists(remoteSocket: RemoteSocket) {
    let isSameAddress = (element: RemoteSocket) => element.address == remoteSocket.address;
    let isSamePort = (element: RemoteSocket) => element.port === remoteSocket.port;

    return sockets.some((s) => isSameAddress(s) && isSamePort(s));
}

function initMessageHandler(ws: WebSocket) {
    ws.on("message", (message: Message) => {        
        console.log(message.toString());
        let parsedMessage = JSON.parse(message.toString());
        
        switch (parsedMessage.type){
            case MessageType.SERVER_PORT_NOTIFICATION:
            {
                const {clientPort, serverPort} = JSON.parse(parsedMessage.data);
                console.log("UWAGA!!!", clientPort, serverPort);
                
                let socketToChange = sockets.find(s => s.port == clientPort);
                if (typeof socketToChange === "undefined"){
                    return;
                }
                
                socketToChange.port = serverPort;
            }
        }
    });
}



function initErrorHandler(ws: WebSocket) {
    const closeConnection = (ws: WebSocket) => {
        console.log("Connection to " + ws.url + " failed");
        let socketToDeleteIndex = sockets.findIndex(s => s.webSocket == ws);
        if (socketToDeleteIndex == -1) {
            return;
        }
        sockets.splice(socketToDeleteIndex, 1);
    };
    ws.on("close", () => closeConnection(ws));
    ws.on("error", () => closeConnection(ws));
}

function connectToPeers(newPeers: string[]) {
    newPeers.forEach((peer) => {
        let peerTokens = peer.split(':');
        let address = peerTokens[1].replace("//", "");
        let port = peerTokens[2];
        
        const ws = new WebSocket(peer);
        ws.on("open", (wsResponse: WebSocket) => {            
            // @ts-ignore
            console.log("initConnection on ConnectToPeers method called", ws._socket.remoteAddress, ws._socket.remotePort);
            // @ts-ignore
            initConnection(ws, address, port)
            // @ts-ignore
            console.log(ws._socket);
            // @ts-ignore
            console.log(ws._socket.remotePort);
            
            // @ts-ignore
            let message = new Message(MessageType.SERVER_PORT_NOTIFICATION, JSON.stringify({clientPort: ws._socket.remotePort, serverPort: wsServer.options.port}));
            write(ws, message);
        });
        ws.on("error", (error) => {
            console.log("Connection failed " + error);
        });
    });
}

// TODO Zdefniować lepszy typ
function write(ws: WebSocket, message: any) {
    ws.send(JSON.stringify(message));
}

function broadcast(message: any) {
    sockets.forEach((socket) => write(socket.webSocket, message));
}

initHttpServer();
initP2PServer();
connectToPeers(initialPeers);