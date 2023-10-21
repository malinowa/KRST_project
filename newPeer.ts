export class NewPeer {
    httpPort: number;
    p2pAddress: string;
    p2pPort: number;
    
    constructor(httpPort: number, p2pAddress: string,p2pPort: number) {
        this.httpPort = httpPort;
        this.p2pAddress = p2pAddress;
        this.p2pPort = p2pPort;
    }
}