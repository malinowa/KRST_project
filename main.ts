import express, {Express, Request, Response} from 'express';
import bodyParser from "body-parser"
import {Server, WebSocket} from "ws"
import dotenv from 'dotenv';
import colorizer from "json-colorizer";

import {Identity, Message, MessageType, NewPeer, RemoteSocket} from "./wrappers";
import {Wallet} from "./wallet";

dotenv.config();

const httpHost: string = process.env.HTTP_HOST || "127.0.0.1";
const httpPort: number = Number(process.env.HTTP_PORT) || 3001;
const p2pPort: number = Number(process.env.P2P_PORT) || 6001;
const initialPeers: string[] = process.env.PEERS ? process.env.PEERS.split(",") : [];
const sockets: RemoteSocket[] = new Array<RemoteSocket>();
let wsServer: Server;
const verificationResults: Map<RemoteSocket, boolean> = new Map();

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

    app.post("/broadcast", (req: Request<{}, {}, { data: string }>, res: Response) => {
        broadcast(new Message(MessageType.LOG_INFORMATION, req.body.data));
        res.send();
    })

    app.listen(httpPort, () => console.log("Listening HTTP on port: " + httpPort));
}

function initP2PServer() {
    wsServer = new WebSocket.Server({host: httpHost, port: p2pPort});
    wsServer.on("connection", (ws: WebSocket) => {
        // @ts-ignore
        return initConnection(ws, ws._socket.remoteAddress, ws._socket.remotePort)
    });
    console.log("Listening P2P on port: " + p2pPort);
}

function initConnection(webSocket: WebSocket, address: string, port: number) {
    AddSocketIfNotOnList(webSocket, address, port);

    initMessageHandler(webSocket);
    initErrorHandler(webSocket);

    write(webSocket, new Message(MessageType.LOG_INFORMATION, `Initialized connection from ${httpHost}:${p2pPort}`));
}

function AddSocketIfNotOnList(webSocket: WebSocket, address: string, port: number) {
    let socket = new RemoteSocket(address, port, webSocket);
    if (socketAlreadyExists(socket)) {
        return;
    }

    sockets.push(socket);
}

function socketAlreadyExists(remoteSocket: RemoteSocket) {
    let isSameAddress = (element: RemoteSocket) => element.address == remoteSocket.address;
    let isSamePort = (element: RemoteSocket) => element.port === remoteSocket.port;

    return sockets.some((s) => isSameAddress(s) && isSamePort(s));
}

function initMessageHandler(ws: WebSocket) {
    ws.on("message", (message: Message) => {
        let parsedMessage = JSON.parse(message.toString());

        switch (parsedMessage.type) {
            case MessageType.LOG_INFORMATION: {
                console.log(parsedMessage.data)
            }
                break;
            case MessageType.VERIFICATION_REQUEST: {
                let request = parsedMessage.data as Identity;
                let isValid = Wallet.verifySignature(request.message, request.signature, request.publicKey);
                let responseMessage = new Message(MessageType.VERIFICATION_RESPONSE, isValid)

                write(ws, responseMessage);
            }
                break;
            case MessageType.VERIFICATION_RESPONSE: {
                let result = parsedMessage.data as boolean;
                verificationResults.set(getRemoteSocketByWebSocket(ws)!, result);
                if (verificationResults.size == sockets.length) {
                    let allResults = [...verificationResults.values()];
                    let declinedCount = allResults.filter(r => !r).length;
                    
                    if (declinedCount >= Math.floor(sockets.length / 2) + 1) {
                        console.log(`Closing websocket ${wsServer.options.host}: ${wsServer.options.port} due to invalid verification`);
                        wsServer.close()
                    }
                }
            }
                break;
        }
    });
}

function getRemoteSocketByWebSocket(webSocket: WebSocket): RemoteSocket | undefined {
    return sockets.find((socket) => {
        return JSON.stringify(socket.webSocket) == JSON.stringify(webSocket);
    })
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
        const ws = new WebSocket(peer);
        ws.on("open", () => {
            // @ts-ignore
            initConnection(ws, ws._socket.remoteAddress, Number(ws._socket.remotePort));
            sendAuthorizationRequest();
        });
        ws.on("error", (error) => {
            console.log("Connection failed " + error);
        });
    });
}

function sendAuthorizationRequest() {
    let messageToEncrypt = `ws://${wsServer.options.host}:${wsServer.options.port}`;
    let signature = Wallet.sign(messageToEncrypt, wallet.getPrivateKey());
    let identity = new Identity(messageToEncrypt, signature, wallet.getPublicKey());
    let message = new Message(MessageType.VERIFICATION_REQUEST, identity)

    broadcast(message);
}

function write(ws: WebSocket, message: Message) {
    ws.send(JSON.stringify(message));
}

function broadcast(message: Message) {
    sockets.forEach((socket) => write(socket.webSocket, message));
}

initHttpServer();
initP2PServer();
const wallet = new Wallet();
connectToPeers(initialPeers);