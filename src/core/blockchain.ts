import {Block} from "./block";
import {Transaction} from "./transaction";
import {ChildProcess} from "child_process";
import {ForkMessage} from "../wrappers/messages";

import {OperationResult} from "../wrappers/results";

const GenesisBlock: Block = new Block([], "", (new Date("November 19, 1335 15:00:00")).toISOString());
GenesisBlock.hash = GenesisBlock.generateHash(JSON.stringify([]));
const BlockchainAddress = "SYSTEM";
const RewardMessage = "Here is your mining reward";

export class Blockchain {
    chain: Block[] = new Array<Block>(GenesisBlock);
    difficulty: number;
    blockReward: number;
    awaitingTransactions: Transaction[] = new Array<Transaction>();
    worker: ChildProcess;

    constructor(difficulty: number, blockReward: number) {
        this.difficulty = difficulty;
        this.blockReward = blockReward;
    }

    pushBlock(block: Block) {
        this.chain.push(block);
    }

    mineBlock(minerAddress: string, privateKey: string) {
        const rewardTransaction = Transaction.create(BlockchainAddress, minerAddress, this.blockReward, RewardMessage, privateKey);
        this.awaitingTransactions.push(rewardTransaction);

        let message = new ForkMessage(this.awaitingTransactions, this.getLastBlock().hash, this.difficulty);
        this.worker.send(message.toString());
    }

    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }

    stopMining() {
        this.awaitingTransactions = [];
        console.log(this.displayCurrentState());
        if (this.worker !== undefined) {
            this.worker.kill();
        }
    }

    verifyBlock(block: Block) {
        const isHashCorrect = block.generateVerificationHash() === block.hash;
        const isPreviousHashCorrect = this.getLastBlock().hash === block.previousHash;

        const desiredBeginOfHash = Array(this.difficulty + 1).join("0");
        const proofOfWorkResult = block.hash.substring(0, this.difficulty) === desiredBeginOfHash;

        return isHashCorrect && isPreviousHashCorrect && proofOfWorkResult;
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

    addTransactionWithVerification(transactionToAdd: Transaction): OperationResult {
        if (transactionToAdd.sender === transactionToAdd.receiver) {
            return OperationResult.Failure("Invalid transaction! Cannot send to yourself");
        }

        if (this.transactionExists(transactionToAdd.hash)) {
            return OperationResult.Failure("Invalid transaction! Cannot add transaction that already exists");
        }

        let senderAccountBalance = this.getAccountBalance(transactionToAdd.sender);
        let commissionedValue = this.getValueOfCommissionedTransactions(transactionToAdd.sender);
        if (transactionToAdd.amount > senderAccountBalance || commissionedValue + transactionToAdd.amount > senderAccountBalance) {
            return OperationResult.Failure("Insufficient funds! Cannot add transaction when balance is only " + senderAccountBalance);
        }

        this.awaitingTransactions.push(transactionToAdd);
        return OperationResult.Success();
    }

    transactionExists(hash: string): boolean {
        for (let block of this.chain) {
            for (let trans of block.transactions) {
                if (trans.hash === hash) {
                    return true;
                }
            }
        }

        return false;
    }

    getAccountBalance(mailAddress: string): number {
        let balance = 0;
        for (let block of this.chain) {
            for (let trans of block.transactions) {
                if (trans.sender === mailAddress) {
                    balance -= trans.amount;
                } else if (trans.receiver === mailAddress) {
                    balance += trans.amount;
                }
            }
        }

        return balance;
    }

    getValueOfCommissionedTransactions(mailAddress: string): number {
        let balance = 0;
        for (let trans of this.awaitingTransactions) {
            if (trans.sender === mailAddress) {
                balance += trans.amount;
            }
        }

        return balance;
    }

    displayCurrentState() {
        return {
            chain: this.chain,
            difficulty: this.difficulty,
            blockReward: this.blockReward,
            transactions: this.awaitingTransactions
        }
    }
}