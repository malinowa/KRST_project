export class Configuration {
    httpHost: string;
    httpPort: number;
    p2pPort: number;
    initialPeers: string[];
    mailAddress: string;

    constructor() {
        this.httpHost = process.env.HTTP_HOST || "127.0.0.1";
        this.httpPort = Number(process.env.HTTP_PORT) || 3001;
        this.p2pPort = Number(process.env.P2P_PORT) || 6001;
        this.initialPeers = process.env.PEERS ? process.env.PEERS.split(",") : [];
        
        if (process.env.EMAIL === undefined)
        {
            throw new Error("Mail address was not specified!");
        }
        
        this.mailAddress  = process.env.EMAIL;
    }
}