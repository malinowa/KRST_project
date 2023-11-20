import {Block} from "./block";
import {ForkMessage} from "./messages";

process.on("message", (message: string) => {
    let parsedMessage = (JSON.parse(message) as ForkMessage);
    const block = new Block(parsedMessage.transactions, parsedMessage.lastBlockHash);
    console.log("Block initialized")
    block.mine(parsedMessage.difficulty);
});