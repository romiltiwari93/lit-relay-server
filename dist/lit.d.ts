import { ethers } from "ethers";
import { RedisClientType } from "redis";
import { AuthMethodType, PKP, StoreConditionWithSigner } from "./models";
export declare function getProvider(): ethers.providers.JsonRpcProvider;
export declare function getPkpEthAddress(tokenId: string): Promise<any>;
export declare function getPkpPublicKey(tokenId: string): Promise<any>;
export declare function storeConditionWithSigner(storeConditionRequest: StoreConditionWithSigner): Promise<ethers.Transaction>;
export declare function mintPKP({ authMethodType, authMethodId, authMethodPubkey, }: {
    authMethodType: AuthMethodType;
    authMethodId: string;
    authMethodPubkey: string;
}): Promise<ethers.Transaction>;
export declare function getPKPsForAuthMethod({ authMethodType, idForAuthMethod, }: {
    authMethodType: AuthMethodType;
    idForAuthMethod: string;
}): Promise<PKP[]>;
export declare function getPubkeyForAuthMethod({ authMethodType, authMethodId, }: {
    authMethodType: AuthMethodType;
    authMethodId: string;
}): Promise<string>;
/**
 * This function returns the next available PKP that can be minted. Specifically,
 *
 * 1. Gets 1 unminted PKP from the data store - eg. ZRANGEBYSCORE myzset 0 0 LIMIT 0 1
 *    (assuming all unminted PKPs have a score of 0)
 * 2. Sets the score of the PKP to 1 to mark it as "used", optimistically - eg. ZADD myzset 1 0x1234
 * 3. Returns the PKP public key.
 */
export declare function getNextAvailablePkpPubkey(redisClient: RedisClientType): Promise<string>;
