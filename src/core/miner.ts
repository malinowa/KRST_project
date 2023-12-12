import {Block} from "./block";
import {ForkMessage} from "../wrappers/messages";

let block: Block;

process.on("message", (message: string) => {
    const parsedMessage = (JSON.parse(message) as ForkMessage);
    block = new Block(parsedMessage.transactions, parsedMessage.lastBlockHash);
    console.log("Block initialized")
    block.mine(parsedMessage.difficulty);
    sendMinedBlock();
});

function sendMinedBlock() {
    process.send!(block.toString());
}
