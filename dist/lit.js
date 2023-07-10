"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextAvailablePkpPubkey = exports.getPubkeyForAuthMethod = exports.getPKPsForAuthMethod = exports.mintPKP = exports.storeConditionWithSigner = exports.getPkpPublicKey = exports.getPkpEthAddress = exports.getProvider = void 0;
const ethers_1 = require("ethers");
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("./config"));
const redisClient_1 = __importDefault(require("./lib/redisClient"));
function getProvider() {
    return new ethers_1.ethers.providers.JsonRpcProvider(process.env.LIT_TXSENDER_RPC_URL);
}
exports.getProvider = getProvider;
function getSigner() {
    const provider = getProvider();
    const privateKey = process.env.LIT_TXSENDER_PRIVATE_KEY;
    const signer = new ethers_1.ethers.Wallet(privateKey, provider);
    return signer;
}
function getContract(abiPath, deployedContractAddress) {
    const signer = getSigner();
    const contractJson = JSON.parse(fs_1.default.readFileSync(abiPath, "utf8"));
    const ethersContract = new ethers_1.ethers.Contract(deployedContractAddress, contractJson, signer);
    return ethersContract;
}
function getAccessControlConditionsContract() {
    return getContract("./contracts/AccessControlConditions.json", config_1.default.accessControlConditionsAddress);
}
function getPkpHelperContractAbiPath() {
    if (config_1.default.useSoloNet) {
        return "./contracts/SoloNetPKPHelper.json";
    }
    return "./contracts/PKPHelper.json";
}
function getPkpNftContractAbiPath() {
    if (config_1.default.useSoloNet) {
        return "./contracts/SoloNetPKP.json";
    }
    return "./contracts/PKPNFT.json";
}
function getPkpHelperContract() {
    return getContract(getPkpHelperContractAbiPath(), config_1.default.pkpHelperAddress);
}
function getPermissionsContract() {
    return getContract("./contracts/PKPPermissions.json", config_1.default.pkpPermissionsAddress);
}
function getPkpNftContract() {
    return getContract(getPkpNftContractAbiPath(), config_1.default.pkpNftAddress);
}
function prependHexPrefixIfNeeded(hexStr) {
    if (hexStr.substring(0, 2) === "0x") {
        return hexStr;
    }
    return `0x${hexStr}`;
}
async function getPkpEthAddress(tokenId) {
    const pkpNft = getPkpNftContract();
    return pkpNft.getEthAddress(tokenId);
}
exports.getPkpEthAddress = getPkpEthAddress;
async function getPkpPublicKey(tokenId) {
    const pkpNft = getPkpNftContract();
    return pkpNft.getPubkey(tokenId);
}
exports.getPkpPublicKey = getPkpPublicKey;
async function storeConditionWithSigner(storeConditionRequest) {
    console.log("Storing condition");
    const accessControlConditions = getAccessControlConditionsContract();
    const tx = await accessControlConditions.storeConditionWithSigner(prependHexPrefixIfNeeded(storeConditionRequest.key), prependHexPrefixIfNeeded(storeConditionRequest.value), prependHexPrefixIfNeeded(storeConditionRequest.securityHash), storeConditionRequest.chainId, storeConditionRequest.permanent, ethers_1.utils.getAddress(storeConditionRequest.creatorAddress));
    console.log("tx", tx);
    return tx;
}
exports.storeConditionWithSigner = storeConditionWithSigner;
async function mintPKP({ authMethodType, authMethodId, authMethodPubkey, }) {
    console.log("in mintPKP");
    const pkpHelper = getPkpHelperContract();
    const pkpNft = getPkpNftContract();
    // first get mint cost
    const mintCost = await pkpNft.mintCost();
    // then, mint PKP using helper
    if (config_1.default.useSoloNet) {
        console.info("Minting PKP against SoloNet PKPHelper contract", {
            authMethodType,
            authMethodId,
            authMethodPubkey,
        });
        // Get next unminted PKP pubkey.
        const pkpPubkeyForPkpNft = await getNextAvailablePkpPubkey(redisClient_1.default);
        const tx = await pkpHelper.mintAndAddAuthMethods(pkpPubkeyForPkpNft, // In SoloNet, we choose which PKP pubkey we would like to attach to the minted PKP.
        [authMethodType], [authMethodId], [authMethodPubkey], [[ethers_1.ethers.BigNumber.from("0")]], true, false, { value: mintCost });
        console.log("tx", tx);
        return tx;
    }
    else {
        console.info("Minting PKP against PKPHelper contract", {
            authMethodType,
            authMethodId,
            authMethodPubkey,
        });
        const tx = await pkpHelper.mintNextAndAddAuthMethods(2, [authMethodType], [authMethodId], [authMethodPubkey], [[ethers_1.ethers.BigNumber.from("0")]], true, true, { value: mintCost });
        console.log("tx", tx);
        return tx;
    }
}
exports.mintPKP = mintPKP;
async function getPKPsForAuthMethod({ authMethodType, idForAuthMethod, }) {
    if (!authMethodType || !idForAuthMethod) {
        throw new Error("Auth method type and id are required to fetch PKPs by auth method");
    }
    const pkpPermissions = getPermissionsContract();
    if (pkpPermissions) {
        try {
            const tokenIds = await pkpPermissions.getTokenIdsForAuthMethod(authMethodType, idForAuthMethod);
            const pkps = [];
            for (let i = 0; i < tokenIds.length; i++) {
                const pubkey = await pkpPermissions.getPubkey(tokenIds[i]);
                if (pubkey) {
                    const ethAddress = ethers_1.ethers.utils.computeAddress(pubkey);
                    pkps.push({
                        tokenId: tokenIds[i],
                        publicKey: pubkey,
                        ethAddress: ethAddress,
                    });
                }
            }
            return pkps;
        }
        catch (err) {
            throw new Error("Unable to get PKPs for auth method");
        }
    }
    else {
        throw new Error("Unable to connect to PKP Permissions contract");
    }
}
exports.getPKPsForAuthMethod = getPKPsForAuthMethod;
async function getPubkeyForAuthMethod({ authMethodType, authMethodId, }) {
    const permissionsContract = getPermissionsContract();
    const pubkey = permissionsContract.getUserPubkeyForAuthMethod(authMethodType, authMethodId);
    return pubkey;
}
exports.getPubkeyForAuthMethod = getPubkeyForAuthMethod;
// export function packAuthData({
//   credentialPublicKey,
//   credentialID,
//   counter,
// }: {
//   credentialPublicKey: Buffer;
//   credentialID: Buffer;
//   counter: number;
// }): Buffer {
//   // mint a PKP for this user
//   // first, pack the credential public key, credential id, and counter into bytes
//   const formattedJson = JSON.stringify({
//     pubkey: credentialPublicKey.toString("base64"),
//     cid: credentialID.toString("base64"),
//     counter,
//   });
//   console.log("formattedJson", formattedJson);
//   const packed = Buffer.from(formattedJson, "utf8");
//   console.log("packed", packed);
//   return packed;
// }
/**
 * This function returns the next available PKP that can be minted. Specifically,
 *
 * 1. Gets 1 unminted PKP from the data store - eg. ZRANGEBYSCORE myzset 0 0 LIMIT 0 1
 *    (assuming all unminted PKPs have a score of 0)
 * 2. Sets the score of the PKP to 1 to mark it as "used", optimistically - eg. ZADD myzset 1 0x1234
 * 3. Returns the PKP public key.
 */
async function getNextAvailablePkpPubkey(redisClient) {
    // 1. Get 1 unminted PKP from the data store
    const unmintedPkpPubkey = await redisClient.zRangeByScore("pkp_public_keys", 0, 0, {
        LIMIT: {
            offset: 0,
            count: 1,
        },
    });
    if (unmintedPkpPubkey.length === 0) {
        throw new Error("No more PKPs available");
    }
    const unmintedPkpPubkeyToUse = unmintedPkpPubkey[0];
    // 2. Set the score of the PKP to 1 to mark it as "used", optimistically
    await redisClient.zAdd("pkp_public_keys", {
        score: 1,
        value: unmintedPkpPubkeyToUse,
    });
    // 3. Return the PKP public key
    return unmintedPkpPubkeyToUse;
}
exports.getNextAvailablePkpPubkey = getNextAvailablePkpPubkey;
//# sourceMappingURL=lit.js.map