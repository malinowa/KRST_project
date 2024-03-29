import {ec} from 'elliptic';

const ellipticCurve: ec = new ec("secp256k1")

export class Wallet {
    keyPair: ec.KeyPair;
    mailAddress: string;

    constructor(mailAddress: string) {
        this.keyPair = ellipticCurve.genKeyPair();
        this.mailAddress = mailAddress;
    }

    getPublicKey(): string {
        return this.keyPair.getPublic().encode("hex", false);
    }

    getPrivateKey(): string {
        return this.keyPair.getPrivate().toString(16);
    }

    static sign(message: string, privateKey: string): ec.Signature {
        let keyPair = ellipticCurve.keyFromPrivate(privateKey, "hex");
        return keyPair.sign(message);
    }

    static verifySignature(message: string, signature: ec.Signature, publicKey: string): boolean {
        let keyPair = ellipticCurve.keyFromPublic(publicKey, "hex");
        if (!keyPair.verify(message, signature)) {
            console.log("verification error");
            return false;
        }
        return true;
    }
}