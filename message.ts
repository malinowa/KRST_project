export enum MessageType {
    QUERY_LATEST= 0,
    QUERY_ALL= 1,
    RESPONSE_BLOCKCHAIN= 2,
    QUERY_PENDING = 3,
    RESPONSE_PENDING= 4,
    LOG_INFORMATION = 5
}

export class Message {
    type: MessageType;
    data: string;
    
    constructor(type: MessageType, data: string) {
        this.type = type;
        this.data = data;
    }
}