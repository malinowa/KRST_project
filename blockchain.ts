import {Block} from "./block";
import {Transaction} from "./transaction";

const GenesisBlock: Block = new Block([], "", new Date("November 19, 1335 15:00:00"));
GenesisBlock.hash = GenesisBlock.generateHash(JSON.stringify([]));
const BlockchainAddress = "SYSTEM";
const RewardMessage = "Here is your mining reward";

export class Blockchain {
    chain: Block[] = new Array<Block>(GenesisBlock);
    difficulty: number;
    blockReward: number;
    awaitingTransactions: Transaction[] = new Array<Transaction>();

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

        const block = new Block(this.awaitingTransactions, this.getLastBlock().hash);
        block.mine(this.difficulty);
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
