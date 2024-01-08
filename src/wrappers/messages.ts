import {Transaction} from "../core/transaction";
import {ec} from "elliptic";

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

export enum MessageType {
    LOG_INFORMATION = 1,
    VERIFICATION_REQUEST = 2,
    VERIFICATION_RESPONSE = 3,
    BLOCK_MINED = 4,
    TRANSACTION_ADDED = 5,
    CHECK_IF_BLOCK_EXISTS = 6,
    INSERT_LACKING_BLOCKS = 7,
    BLOCK_NOT_FOUND = 8
}

export class Message {
    type: MessageType;
    data: string | boolean | Identity;

    constructor(type: MessageType, data: string | boolean | Identity) {
        this.type = type;
        this.data = data;
    }
}

export class Identity {
    message: string;
    signature: ec.Signature;
    publicKey: string;

    constructor(message: string, signature: ec.Signature, publicKey: string) {
        this.message = message;
        this.signature = signature;
        this.publicKey = publicKey;
    }
}