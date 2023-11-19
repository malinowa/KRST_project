import {Transaction} from "./transaction";
import {createHash} from "crypto";

export class Block {
    timestamp: Date;
    transactions: Transaction[];
    nonce: number = 0;
    hash: string = "";
    previousHash: string;

    constructor(transactions: Transaction[], previousHash: string, timestamp: Date = new Date()) {
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
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
}