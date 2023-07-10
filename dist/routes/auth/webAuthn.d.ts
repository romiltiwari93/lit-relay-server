import { Request } from "express";
import { Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { AuthMethodVerifyRegistrationResponse, AuthMethodVerifyToFetchResponse, WebAuthnVerifyRegistrationRequest } from "../../models";
/**
 * Generates WebAuthn registration options for a given username.
 */
export declare function webAuthnGenerateRegistrationOptionsHandler(req: Request<{}, {}, {}, ParsedQs, Record<string, any>>, res: Response<{}, Record<string, any>, number>): Response<{}, Record<string, any>, number>;
export declare function webAuthnVerifyRegistrationHandler(req: Request<{}, AuthMethodVerifyRegistrationResponse, WebAuthnVerifyRegistrationRequest, ParsedQs, Record<string, any>>, res: Response<AuthMethodVerifyRegistrationResponse, Record<string, any>, number>): Promise<Response<AuthMethodVerifyRegistrationResponse, Record<string, any>, number>>;
export declare function webAuthnVerifyToFetchPKPsHandler(req: Request<{}, AuthMethodVerifyToFetchResponse, any, ParsedQs, Record<string, any>>, res: Response<AuthMethodVerifyToFetchResponse, Record<string, any>, number>): Promise<Response<AuthMethodVerifyToFetchResponse, Record<string, any>, number>>;
