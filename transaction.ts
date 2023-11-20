import {Wallet} from "./wallet";
import {createHash} from 'crypto'
import {ec} from "elliptic";

export class Transaction {
    sender: string;
    receiver: string;
    amount: number;
    timestamp: string;
    message: string;
    signature: ec.Signature;
    hash: string;

    constructor(sender: string, receiver: string, amount: number, message: string, privateKey: string, timestamp: string | undefined = undefined) {
        this.sender = sender;
        this.receiver = receiver;
        this.amount = amount;
        this.timestamp = timestamp === undefined ? (new Date()).toISOString() : timestamp;
        this.message = message;
        this.hash = this.createHash();
        this.signature = Wallet.sign(this.hash, privateKey);
    }

    createHash(): string {
        return createHash('sha256')
            .update(this.sender + this.receiver + this.amount + this.timestamp + this.message)
            .digest('hex');
    }
}