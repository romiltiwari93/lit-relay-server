"use strict";
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * An example Express server showing off a simple integration of @simplewebauthn/server.
 *
 * The webpages served from ./public use @simplewebauthn/browser.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rpID = void 0;
const fs_1 = __importDefault(require("fs"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
dotenv_1.default.config();
const server_1 = require("@simplewebauthn/server");
const cors_1 = __importDefault(require("cors"));
const google_1 = require("./routes/auth/google");
const status_1 = require("./routes/auth/status");
const limiter_1 = __importDefault(require("./routes/middlewares/limiter"));
const storeCondition_1 = require("./routes/storeCondition");
const apiKeyGateAndTracking_1 = __importDefault(require("./routes/middlewares/apiKeyGateAndTracking"));
const webAuthn_1 = require("./routes/auth/webAuthn");
const discord_1 = require("./routes/auth/discord");
const wallet_1 = require("./routes/auth/wallet");
const config_1 = __importDefault(require("./config"));
const otp_1 = require("./routes/auth/otp");
const app = (0, express_1.default)();
const { ENABLE_CONFORMANCE, ENABLE_HTTPS, RP_ID = "localhost" } = process.env;
app.use(express_1.default.static("./public/"));
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use(limiter_1.default);
app.use(apiKeyGateAndTracking_1.default);
/**
 * If the words "metadata statements" mean anything to you, you'll want to enable this route. It
 * contains an example of a more complex deployment of SimpleWebAuthn with support enabled for the
 * FIDO Metadata Service. This enables greater control over the types of authenticators that can
 * interact with the Rely Party (a.k.a. "RP", a.k.a. "this server").
 */
if (ENABLE_CONFORMANCE === "true") {
    Promise.resolve().then(() => __importStar(require("./fido-conformance"))).then(({ fidoRouteSuffix, fidoConformanceRouter }) => {
        app.use(fidoRouteSuffix, fidoConformanceRouter);
    });
}
/**
 * RP ID represents the "scope" of websites on which a authenticator should be usable. The Origin
 * represents the expected URL from which registration or authentication occurs.
 */
exports.rpID = RP_ID;
/**
 * 2FA and Passwordless WebAuthn flows expect you to be able to uniquely identify the user that
 * performs registration or authentication. The user ID you specify here should be your internal,
 * _unique_ ID for that user (uuid, etc...). Avoid using identifying information here, like email
 * addresses, as it may be stored within the authenticator.
 *
 * Here, the example server assumes the following user has completed login:
 */
const loggedInUserId = "internalUserId";
const inMemoryUserDeviceDB = {
    [loggedInUserId]: {
        id: loggedInUserId,
        username: `user@${exports.rpID}`,
        devices: [],
        /**
         * A simple way of storing a user's current challenge being signed by registration or authentication.
         * It should be expired after `timeout` milliseconds (optional argument for `generate` methods,
         * defaults to 60000ms)
         */
        currentChallenge: undefined,
    },
};
/**
 * Registration (a.k.a. "Registration")
 */
app.get("/generate-registration-options", (req, res) => {
    const user = inMemoryUserDeviceDB[loggedInUserId];
    const { 
    /**
     * The username can be a human-readable name, email, etc... as it is intended only for display.
     */
    username, devices, } = user;
    const opts = {
        rpName: "SimpleWebAuthn Example",
        rpID: exports.rpID,
        userID: loggedInUserId,
        userName: username,
        timeout: 60000,
        attestationType: "none",
        /**
         * Passing in a user's list of already-registered authenticator IDs here prevents users from
         * registering the same device multiple times. The authenticator will simply throw an error in
         * the browser if it's asked to perform registration when one of these ID's already resides
         * on it.
         */
        excludeCredentials: devices.map((dev) => ({
            id: dev.credentialID,
            type: "public-key",
            transports: dev.transports,
        })),
        /**
         * The optional authenticatorSelection property allows for specifying more constraints around
         * the types of authenticators that users to can use for registration
         */
        authenticatorSelection: {
            userVerification: "required",
            residentKey: "required",
        },
        /**
         * Support the two most common algorithms: ES256, and RS256
         */
        supportedAlgorithmIDs: [-7, -257],
    };
    const options = (0, server_1.generateRegistrationOptions)(opts);
    /**
     * The server needs to temporarily remember this value for verification, so don't lose it until
     * after you verify an authenticator response.
     */
    inMemoryUserDeviceDB[loggedInUserId].currentChallenge = options.challenge;
    res.send(options);
});
/**
 * Login (a.k.a. "Authentication")
 */
app.get("/generate-authentication-options", (req, res) => {
    // You need to know the user by this point
    const user = inMemoryUserDeviceDB[loggedInUserId];
    const opts = {
        timeout: 60000,
        allowCredentials: user.devices.map((dev) => ({
            id: dev.credentialID,
            type: "public-key",
            transports: dev.transports,
        })),
        userVerification: "required",
        rpID: exports.rpID,
    };
    const options = (0, server_1.generateAuthenticationOptions)(opts);
    /**
     * The server needs to temporarily remember this value for verification, so don't lose it until
     * after you verify an authenticator response.
     */
    inMemoryUserDeviceDB[loggedInUserId].currentChallenge = options.challenge;
    res.send(options);
});
// --- Store condition
app.post("/store-condition", storeCondition_1.storeConditionHandler);
// --- Mint PKP for authorized account
app.post("/auth/google", google_1.googleOAuthVerifyToMintHandler);
app.post("/auth/discord", discord_1.discordOAuthVerifyToMintHandler);
app.post("/auth/wallet", wallet_1.walletVerifyToMintHandler);
app.post("/auth/otp", otp_1.otpVerifyToMintHandler);
// --- Fetch PKPs tied to authorized account
app.post("/auth/google/userinfo", google_1.googleOAuthVerifyToFetchPKPsHandler);
app.post("/auth/discord/userinfo", discord_1.discordOAuthVerifyToFetchPKPsHandler);
app.post("/auth/wallet/userinfo", wallet_1.walletVerifyToFetchPKPsHandler);
app.post("/auth/otp/userinfo", otp_1.otpVerifyToFetchPKPsHandler);
app.post("/auth/webauthn/userinfo", webAuthn_1.webAuthnVerifyToFetchPKPsHandler);
// --- Poll minting progress
app.get("/auth/status/:requestId", status_1.getAuthStatusHandler);
// --- WebAuthn
app.post("/auth/webauthn/verify-registration", webAuthn_1.webAuthnVerifyRegistrationHandler);
app.get("/auth/webauthn/generate-registration-options", webAuthn_1.webAuthnGenerateRegistrationOptionsHandler);
if (ENABLE_HTTPS) {
    const host = "0.0.0.0";
    const port = 443;
    https_1.default
        .createServer({
        /**
         * See the README on how to generate this SSL cert and key pair using mkcert
         */
        key: fs_1.default.readFileSync(`./${exports.rpID}.key`),
        cert: fs_1.default.readFileSync(`./${exports.rpID}.crt`),
    }, app)
        .listen(port, host, () => {
        console.log(`🚀 Server ready at ${host}:${port}`);
    });
}
else {
    const host = "127.0.0.1";
    const port = config_1.default.port;
    http_1.default.createServer(app).listen(port, () => {
        console.log(`🚀 Server ready at ${host}:${port}`);
    });
}
//# sourceMappingURL=index.js.map