"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpVerifyToFetchPKPsHandler = exports.otpVerifyToMintHandler = void 0;
const models_1 = require("../../models");
const lit_1 = require("../../lit");
const node_fetch_1 = __importDefault(require("node-fetch"));
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
// TODO: UPDATE TO DEPLOYED DOMAIN
const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || "https://auth-api.litgateway.com/api/otp/verify";
async function verifyOtpJWT(jwt) {
    const res = await (0, node_fetch_1.default)(AUTH_SERVER_URL, {
        redirect: "error",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'api-key': '67e55044-10b1-426f-9247-bb680e5fe0c8_relayer'
        },
        body: JSON.stringify({
            token: jwt,
        }),
    });
    if (res.status < 200 || res.status > 299) {
        throw new Error("Error while verifying token on remote endpoint");
    }
    const respBody = await res.json();
    return respBody;
}
async function otpVerifyToMintHandler(req, res) {
    const { accessToken } = req.body;
    let payload;
    const tmpToken = (" " + accessToken).slice(1);
    let userId;
    let tokenBody;
    let orgId;
    try {
        tokenBody = parseJWT(tmpToken);
        orgId = tokenBody.orgId.toLowerCase();
        let message = tokenBody['extraData'];
        let contents = message.split("|");
        if (contents.length !== 2) {
            throw new Error("invalid message format in token message");
        }
        userId = contents[0];
        payload = await verifyOtpJWT(accessToken);
        if (payload.userId !== userId) {
            throw new Error("UserId does not match token contents");
        }
        console.info("Sucessful verification of OTP token", {
            userid: payload.userId,
        });
    }
    catch (e) {
        console.error("unable to verify OTP token ", e);
        return res.status(400).json({
            error: "Unable to verify OTP token",
        });
    }
    // mint PKP for user
    try {
        const authMethodId = ethers_1.utils.keccak256((0, utils_1.toUtf8Bytes)(`${userId}:${orgId}`));
        const mintTx = await (0, lit_1.mintPKP)({
            authMethodType: models_1.AuthMethodType.OTP,
            authMethodId,
            authMethodPubkey: "0x",
        });
        console.info("Minting PKP OTP", {
            requestId: mintTx.hash,
        });
        return res.status(200).json({
            requestId: mintTx.hash,
        });
    }
    catch (err) {
        console.error("Unable to mint PKP for given OTP request", { err });
        return res.status(500).json({
            error: "Unable to mint PKP for given OTP request",
        });
    }
}
exports.otpVerifyToMintHandler = otpVerifyToMintHandler;
async function otpVerifyToFetchPKPsHandler(req, res) {
    const { accessToken } = req.body;
    const tmpToken = (" " + accessToken).slice(1);
    let userId;
    let tokenBody;
    try {
        tokenBody = parseJWT(tmpToken);
        let message = tokenBody.extraData;
        let contents = message.split("|");
        if (contents.length !== 2) {
            throw new Error("invalid message format in token message");
        }
        userId = contents[0];
        console.log(userId);
        const resp = await verifyOtpJWT(accessToken);
        if (resp.userId !== userId) {
            throw new Error("UserId does not match token contents");
        }
        console.info("Sucessful verification of OTP token", {
            userid: resp.userId,
        });
    }
    catch (e) {
        console.error("unable to verify OTP token");
        return res.status(400).json({
            error: "Unable to verify OTP token",
        });
    }
    // fetch PKPs for user
    try {
        let idForAuthMethod = userId;
        let orgId = tokenBody.orgId.toLowerCase();
        idForAuthMethod = ethers_1.utils.keccak256((0, utils_1.toUtf8Bytes)(`${userId}:${orgId}`));
        const pkps = await (0, lit_1.getPKPsForAuthMethod)({
            authMethodType: models_1.AuthMethodType.OTP,
            idForAuthMethod,
        });
        console.info("Fetched PKPs with OTP auth", {
            pkps: pkps,
        });
        return res.status(200).json({
            pkps: pkps,
        });
    }
    catch (err) {
        console.error("Unable to fetch PKPs for given userId", { err });
        return res.status(500).json({
            error: "Unable to fetch PKPs for given user Id",
        });
    }
}
exports.otpVerifyToFetchPKPsHandler = otpVerifyToFetchPKPsHandler;
/**
 *
 * @param jwt token to parse
 * @returns {string}- userId contained within the token message
 */
function parseJWT(jwt) {
    let parts = jwt.split(".");
    if (parts.length !== 3) {
        throw new Error("Invalid token length");
    }
    let body = Buffer.from(parts[1], 'base64');
    let parsedBody = JSON.parse(body.toString('ascii'));
    console.log("JWT body: ", parsedBody);
    return parsedBody;
}
//# sourceMappingURL=otp.js.map