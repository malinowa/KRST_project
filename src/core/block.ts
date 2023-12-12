import {Transaction} from "./transaction";
import {createHash} from "crypto";

export class Block {
    timestamp: string;
    transactions: Transaction[];
    nonce: number = 0;
    hash: string = "";
    previousHash: string;

    constructor(transactions: Transaction[], previousHash: string, timestamp: string | undefined = undefined) {
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.timestamp = timestamp === undefined ? (new Date()).toISOString() : timestamp;
    }

    generateVerificationHash(): string {
        return this.generateHash(JSON.stringify(this.transactions));
    }

    generateHash(transactions: string): string {
        return createHash('sha256')
            .update(this.previousHash + transactions + this.timestamp + this.nonce)
            .digest('hex');
    }

    mine(difficulty: number) {
        const transactionsString = JSON.stringify(this.transactions);
        this.hash = this.generateHash(transactionsString);
        const desiredBeginOfHash = Array(difficulty + 1).join("0");

        while (this.hash.substring(0, difficulty) !== desiredBeginOfHash) {
            console.log(this.hash);
            this.nonce++;
            this.hash = this.generateHash(transactionsString);
        }
        console.log("Final hash = " + this.hash);
    }

    toString() {
        return JSON.stringify(
            {
                timestamp: this.timestamp,
                transactions: this.transactions,
                nonce: this.nonce,
                hash: this.hash,
                previousHash: this.previousHash
            })
    }

    static copy(block: Block) {
        const newBlock = new Block(Transaction.copyMany(block.transactions), block.previousHash, block.timestamp);
        newBlock.hash = block.hash;
        newBlock.nonce = block.nonce;
        return newBlock;
    }
}