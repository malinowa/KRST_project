import {Block} from "./block";
import {Transaction} from "./transaction";

const GenesisBlock: Block = new Block([], "");

export class Blockchain {
    chain: Block[] = new Array<Block>(GenesisBlock);
    difficulty: number;
    blockReward: number;
    awaitingTransactions: Transaction[] = new Array<Transaction>();

    constructor(difficulty: number, blockReward: number) {
        this.difficulty = difficulty;
        this.blockReward = blockReward;
    }
}
