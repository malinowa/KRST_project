import {Block} from "../core/block";
import {Transaction} from "../core/transaction";
import {Blockchain} from "../core/blockchain";

export class OperationResult {
    succeeded: boolean;
    errorMessage: string | null;

    private constructor(succeeded: boolean, errorMessage: string | null = null) {
        this.succeeded = succeeded;
        this.errorMessage = errorMessage;
    }

    static Success() {
        return new OperationResult(true);
    }

    static Failure(errorMessage: string) {
        return new OperationResult(false, errorMessage);
    }
}

export class BlockChainState {
    chain: Block[];
    difficulty: number;
    blockReward: number;
    transactions: Transaction[];

    private constructor() {
    }

    static fromBlockchain(blockchain: Blockchain): BlockChainState {
        let blockChainState = new BlockChainState();
        blockChainState.chain = blockchain.chain;
        blockChainState.difficulty = blockchain.difficulty;
        blockChainState.blockReward = blockchain.blockReward;
        blockChainState.transactions = blockchain.awaitingTransactions;
        return blockChainState;
    }


    static create(chain: Block[], difficulty: number, blockReward: number, transactions: Transaction[]): BlockChainState {
        let blockChainState = new BlockChainState();
        blockChainState.chain = Block.copyMany(chain);
        blockChainState.transactions = Transaction.copyMany(transactions);
        blockChainState.difficulty = difficulty;
        blockChainState.blockReward = blockReward;
        return blockChainState;
    }
}