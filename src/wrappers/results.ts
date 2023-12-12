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