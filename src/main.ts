import express, {Express, Request, Response} from 'express';
import bodyParser from "body-parser"
import {Server, WebSocket} from "ws"
import dotenv from 'dotenv';
import colorizer from "json-colorizer";

import {Wallet} from "./core/wallet";
import {Configuration} from "./configuration";
import {Blockchain} from "./core/blockchain";
import {Block} from "./core/block";
import {fork} from "child_process";
import {Transaction} from "./core/transaction";
import {Identity, Message, MessageType} from "./wrappers/messages";
import {NewPeer, P2PResponse, RemoteSocket} from "./wrappers/communications";

dotenv.config();

const {httpPort, p2pPort, httpHost, initialPeers, mailAddress} = new Configuration();
const sockets: RemoteSocket[] = new Array<RemoteSocket>();
const verificationResults: Map<RemoteSocket, boolean> = new Map();
const wallet: Wallet = new Wallet(mailAddress);
let wsServer: Server;
const blockChain = new Blockchain(4, 10);

function initHttpServer(): void {
    const app: Express = express();
    app.use(bodyParser.json());

    app.get("/peers", (_: Request, res: Response) => {
        const responseData = sockets.map((s) => s.getSocketAddress());
        res.send(responseData);
        console.log("Peers: " + colorizer(JSON.stringify(responseData)));
    });

    app.post("/addPeer", (req: Request<{}, {}, NewPeer>, res: Response) => {
        const newPeerWebSocketUrl = req.body.toWebSocketUrl();
        connectToPeers(newPeerWebSocketUrl);
        res.send();
        console.log("Created new peer with address: " + newPeerWebSocketUrl);
    });

    app.get("/p2p", (_: Request, res: Response) => {
        const result = new P2PResponse(wsServer.options.host, wsServer.options.port)
        res.send(JSON.stringify(result));
        console.log("P2P Server: " + colorizer(JSON.stringify(result)));
    });

    app.post("/broadcast", (req: Request<{}, {}, { data: string }>, res: Response) => {
        broadcast(new Message(MessageType.LOG_INFORMATION, req.body.data));
        res.send();
        console.log(`Broadcasting message "${req.body.data}" from ${wsServer.options.host}:${wsServer.options.port}`)
    })

    app.get("/wallet", (_: Request, res: Response) => {
        res.send({publicKey: wallet.getPublicKey(), privateKey: wallet.getPrivateKey()});
        console.log("Peers: " + colorizer(JSON.stringify({
            publicKey: wallet.getPublicKey(),
            privateKey: wallet.getPrivateKey()
        })));
    });

    app.post('/mine', (_: Request, res: Response) => {
        blockChain.worker = fork('./src/core/miner.ts', {serialization: "advanced"});
        blockChain.worker.on('message', (message: string) => {
            const block = Block.copy(JSON.parse(message) as Block);
            blockChain.pushBlock(block);

            const messageToBroadcast = new Message(MessageType.BLOCK_MINED, message);
            broadcast(messageToBroadcast);

            blockChain.stopMining();
        })

        blockChain.mineBlock(mailAddress, wallet.getPrivateKey());
        res.send({message: "Mining started"});
    });

    app.get('/verifyIntegrity', (_: Request, res: Response) => {
        const result = blockChain.verifyIntegrity();
        res.send({message: "Integrity verification " + (result ? "succeeded" : "failed")});
    });

    app.get('/balance', (req: Request<{}, {}, { emailAddress: string }>, res: Response) => {
        res.send({Message: "Account balance: " + blockChain.getAccountBalance(req.body.emailAddress)});
    });

    app.post('/addTransaction', (req: Request<{}, {}, {
        sender: string,
        receiver: string,
        amount: number,
        message: string
    }>, res: Response) => {
        let newTransaction = Transaction.create(req.body.sender, req.body.receiver, req.body.amount, req.body.message, wallet.getPrivateKey())

        let addingResult = blockChain.addTransactionWithVerification(newTransaction);
        if (!addingResult.succeeded) {
            res.send({message: addingResult.errorMessage});
            return;
        }

        broadcast(new Message(MessageType.TRANSACTION_ADDED, JSON.stringify(newTransaction)));
        res.send({message: "Adding transaction succeeded"});
    })

    app.get('/blockchainState', (_: Request, res: Response) => {
        res.send(JSON.stringify(blockChain.displayCurrentState()));
    });


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
                handleVerificationRequest(ws, parsedMessage.data as Identity)
            }
                break;
            case MessageType.VERIFICATION_RESPONSE: {
                let remoteSocket = getRemoteSocketByWebSocket(ws)!;
                handleVerificationResponse(remoteSocket, parsedMessage.data as boolean);
            }
                break;
            case MessageType.BLOCK_MINED: {
                let block = Block.copy(JSON.parse(parsedMessage.data) as Block);
                handleBlockMined(block);
            }
                break;
            case MessageType.TRANSACTION_ADDED: {
                let transaction = Transaction.copy(JSON.parse(parsedMessage.data) as Transaction);
                blockChain.addTransactionWithVerification(transaction);
            }
                break;
        }
    });
}

function handleVerificationRequest(webSocket: WebSocket, identity: Identity) {
    let isValid = Wallet.verifySignature(identity.message, identity.signature, identity.publicKey);
    let responseMessage = new Message(MessageType.VERIFICATION_RESPONSE, isValid)

    write(webSocket, responseMessage);
}

function getRemoteSocketByWebSocket(webSocket: WebSocket): RemoteSocket | undefined {
    return sockets.find((socket) => {
        return JSON.stringify(socket.webSocket) == JSON.stringify(webSocket);
    })
}

function handleVerificationResponse(socket: RemoteSocket, result: boolean) {
    verificationResults.set(socket!, result);
    if (verificationResults.size == sockets.length) {
        let allResults = [...verificationResults.values()];
        let declinedCount = allResults.filter(r => !r).length;

        if (declinedCount >= Math.floor(sockets.length / 2) + 1) {
            console.log(`Closing websocket ${wsServer.options.host}:${wsServer.options.port} due to invalid verification`);
            verificationResults.clear();
            wsServer.close()
        }
    }
}

function handleBlockMined(block: Block) {
    if (!blockChain.verifyBlock(block)) {
        return;
    }

    blockChain.pushBlock(block);
    blockChain.stopMining();
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
connectToPeers(initialPeers);