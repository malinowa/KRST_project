import {Transaction} from "./transaction";

export class ForkMessage {
    transactions: Array<Transaction>;
    lastBlockHash: string;
    difficulty: number;

    constructor(transactions: Array<Transaction>, lastBlockHash: string, difficulty: number) {
        this.transactions = transactions;
        this.lastBlockHash = lastBlockHash;
        this.difficulty = difficulty;
    }

    toString() {
        return JSON.stringify({transactions: this.transactions, lastBlockHash: this.lastBlockHash, difficulty: this.difficulty})
    }
}