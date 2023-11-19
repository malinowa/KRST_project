import {Transaction} from "./transaction";
import {SHA256} from "crypto-ts"

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
        return SHA256(this.previousHash + transactions + this.timestamp + this.nonce);
    }
}