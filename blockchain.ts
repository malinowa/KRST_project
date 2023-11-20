import {Block} from "./block";
import {Transaction} from "./transaction";
import {ChildProcess, fork} from "child_process";
import {ForkMessage} from "./messages";

const GenesisBlock: Block = new Block([], "", new Date("November 19, 1335 15:00:00"));
GenesisBlock.hash = GenesisBlock.generateHash(JSON.stringify([]));
const BlockchainAddress = "SYSTEM";
const RewardMessage = "Here is your mining reward";

export class Blockchain {
    chain: Block[] = new Array<Block>(GenesisBlock);
    difficulty: number;
    blockReward: number;
    awaitingTransactions: Transaction[] = new Array<Transaction>();
    private worker: ChildProcess;

    constructor(difficulty: number, blockReward: number) {
        this.difficulty = difficulty;
        this.blockReward = blockReward;
    }

    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }

    mineBlock(minerAddress: string, privateKey: string) {
        const rewardTransaction = new Transaction(BlockchainAddress, minerAddress, this.blockReward, RewardMessage, privateKey);
        this.awaitingTransactions.push(rewardTransaction);

        this.worker = fork('./miner.ts', {serialization: "advanced"});
        console.log("New miner thread created")
        let message = new ForkMessage(this.awaitingTransactions, this.getLastBlock().hash, this.difficulty);
        this.worker.send(message.toString());
        console.log("Data sent to miner thread")
    }

    stopMining() {
        this.worker.kill();
    }

    verifyIntegrity(): boolean {
        for (let block of this.chain) {
            for (let transaction of block.transactions) {
                if (transaction.hash !== transaction.createHash()) {
                    return false;
                }
            }
            if (block.hash !== block.generateHash(JSON.stringify(block.transactions))) {
                return false;
            }
        }
        return true;
    }
}
