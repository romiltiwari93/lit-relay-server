import { Request } from "express";
import { Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { AuthSig, AuthMethodVerifyRegistrationResponse, AuthMethodVerifyToFetchResponse } from "../../models";
export declare function walletVerifyToMintHandler(req: Request<{}, AuthMethodVerifyRegistrationResponse, AuthSig, ParsedQs, Record<string, any>>, res: Response<AuthMethodVerifyRegistrationResponse, Record<string, any>, number>): Promise<Response<AuthMethodVerifyRegistrationResponse, Record<string, any>, number>>;
export declare function walletVerifyToFetchPKPsHandler(req: Request<{}, AuthMethodVerifyToFetchResponse, AuthSig, ParsedQs, Record<string, any>>, res: Response<AuthMethodVerifyToFetchResponse, Record<string, any>, number>): Promise<Response<AuthMethodVerifyToFetchResponse, Record<string, any>, number>>;
