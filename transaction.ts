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

    static create(sender: string, receiver: string, amount: number, message: string, privateKey: string, timestamp: string | undefined = undefined) {
        let transaction = new Transaction();

        transaction.sender = sender;
        transaction.receiver = receiver;
        transaction.amount = amount;
        transaction.timestamp = timestamp === undefined ? (new Date()).toISOString() : timestamp;
        transaction.message = message;
        transaction.hash = transaction.createHash();
        transaction.signature = Wallet.sign(transaction.hash, privateKey);
        return transaction;
    }

    private constructor() {
    }

    createHash(): string {
        return createHash('sha256')
            .update(this.sender + this.receiver + this.amount + this.timestamp + this.message)
            .digest('hex');
    }

    static copy(trans: Transaction): Transaction {
        let transaction = new Transaction();
        transaction.sender = trans.sender;
        transaction.receiver = trans.receiver;
        transaction.amount = trans.amount;
        transaction.timestamp = trans.timestamp;
        transaction.message = trans.message;
        transaction.hash = trans.hash;
        transaction.signature = trans.signature;
        return transaction;
    }
    
    static copyMany(transactions: Array<Transaction>): Array<Transaction> {
        let copiedTransactions = new Array<Transaction>();
        for (let trans of transactions){
            copiedTransactions.push(Transaction.copy(trans));
        }
        return copiedTransactions;
    }
}