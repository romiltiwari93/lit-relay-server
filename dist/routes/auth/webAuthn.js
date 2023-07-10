"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webAuthnVerifyToFetchPKPsHandler = exports.webAuthnVerifyRegistrationHandler = exports.webAuthnGenerateRegistrationOptionsHandler = void 0;
const server_1 = require("@simplewebauthn/server");
const models_1 = require("../../models");
const server_2 = require("@simplewebauthn/server");
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const lit_1 = require("../../lit");
const string_1 = require("../../utils/string");
/**
 * Generates WebAuthn registration options for a given username.
 */
function webAuthnGenerateRegistrationOptionsHandler(req, res) {
    // Get username from query string
    const username = req.query.username;
    // Get RP_ID from request Origin.
    const rpID = (0, string_1.getDomainFromUrl)(req.get("Origin") || "localhost");
    const authenticatorUsername = generateUsernameForOptions(username);
    const opts = {
        rpName: "Lit Protocol",
        rpID,
        userID: (0, utils_1.keccak256)((0, utils_1.toUtf8Bytes)(authenticatorUsername)).slice(2),
        userName: authenticatorUsername,
        timeout: 60000,
        attestationType: "direct",
        authenticatorSelection: {
            userVerification: "required",
            residentKey: "required",
        },
        supportedAlgorithmIDs: [-7, -257], // ES256 and RS256
    };
    const options = (0, server_1.generateRegistrationOptions)(opts);
    return res.json(options);
}
exports.webAuthnGenerateRegistrationOptionsHandler = webAuthnGenerateRegistrationOptionsHandler;
async function webAuthnVerifyRegistrationHandler(req, res) {
    // Get RP_ID from request Origin.
    const requestOrigin = req.get("Origin") || "localhost";
    const rpID = (0, string_1.getDomainFromUrl)(requestOrigin);
    // Check if PKP already exists for this credentialRawId.
    console.log("credentialRawId", req.body.credential.rawId);
    const authMethodId = generateAuthMethodId(req.body.credential.rawId);
    try {
        const pubKey = await (0, lit_1.getPubkeyForAuthMethod)({
            authMethodType: models_1.AuthMethodType.WebAuthn,
            authMethodId,
        });
        if (pubKey !== "0x" && !ethers_1.ethers.BigNumber.from(pubKey).isZero()) {
            console.info("PKP already exists for this credential raw ID");
            return res.status(400).send({
                error: "PKP already exists for this credential raw ID, please try another one",
            });
        }
    }
    catch (error) {
        const _error = error;
        console.error(_error);
        return res.status(500).send({
            error: "Unable to verify if PKP already exists",
        });
    }
    // WebAuthn verification.
    let verification;
    try {
        const opts = {
            credential: req.body.credential,
            expectedChallenge: () => true,
            expectedOrigin: [requestOrigin],
            expectedRPID: rpID,
            requireUserVerification: true,
        };
        verification = await (0, server_2.verifyRegistrationResponse)(opts);
    }
    catch (error) {
        const _error = error;
        console.error(_error);
        return res.status(400).send({ error: _error.message });
    }
    const { verified, registrationInfo } = verification;
    // Mint PKP for user.
    if (!verified || !registrationInfo) {
        console.error("Unable to verify registration", { verification });
        return res.status(400).json({
            error: "Unable to verify registration",
        });
    }
    const { credentialPublicKey } = registrationInfo;
    console.log("registrationInfo", { registrationInfo });
    try {
        const cborEncodedCredentialPublicKey = (0, utils_1.hexlify)(ethers_1.utils.arrayify(credentialPublicKey));
        console.log("cborEncodedCredentialPublicKey", {
            cborEncodedCredentialPublicKey,
        });
        const mintTx = await (0, lit_1.mintPKP)({
            authMethodType: models_1.AuthMethodType.WebAuthn,
            authMethodId,
            // We want to use the CBOR encoding here to retain as much information as possible
            // about the COSE (public) key.
            authMethodPubkey: cborEncodedCredentialPublicKey,
        });
        return res.status(200).json({
            requestId: mintTx.hash,
        });
    }
    catch (error) {
        const _error = error;
        console.error("Unable to mint PKP for user", { _error });
        return res.status(500).json({
            error: "Unable to mint PKP for user",
        });
    }
}
exports.webAuthnVerifyRegistrationHandler = webAuthnVerifyRegistrationHandler;
async function webAuthnVerifyToFetchPKPsHandler(req, res) {
    // Check if PKP already exists for this credentialRawId.
    console.log("credentialRawId", req.body.rawId);
    try {
        const idForAuthMethod = generateAuthMethodId(req.body.rawId);
        const pkps = await (0, lit_1.getPKPsForAuthMethod)({
            authMethodType: models_1.AuthMethodType.WebAuthn,
            idForAuthMethod,
        });
        console.info("Fetched PKPs with WebAuthn", {
            pkps: pkps,
        });
        return res.status(200).json({
            pkps: pkps,
        });
    }
    catch (err) {
        console.error("Unable to fetch PKPs for given WebAuthn", { err });
        return res.status(500).json({
            error: "Unable to fetch PKPs for given WebAuthn",
        });
    }
}
exports.webAuthnVerifyToFetchPKPsHandler = webAuthnVerifyToFetchPKPsHandler;
function generateAuthMethodId(credentialRawId) {
    return ethers_1.utils.keccak256((0, utils_1.toUtf8Bytes)(`${credentialRawId}:lit`));
}
// Generate default username given timestamp, using timestamp format YYYY-MM-DD HH:MM:SS)
function generateDefaultUsername() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return `Usernameless user (${year}-${month}-${day} ${hours}:${minutes}:${seconds})`;
}
function generateUsernameForOptions(username) {
    return !!username ? username : generateDefaultUsername();
}
//# sourceMappingURL=webAuthn.js.map