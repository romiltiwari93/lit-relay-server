import { Request } from "express";
import { Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { GoogleOAuthVerifyRegistrationRequest, AuthMethodVerifyRegistrationResponse, AuthMethodVerifyToFetchResponse } from "../../models";
export declare function googleOAuthVerifyToMintHandler(req: Request<{}, AuthMethodVerifyRegistrationResponse, GoogleOAuthVerifyRegistrationRequest, ParsedQs, Record<string, any>>, res: Response<AuthMethodVerifyRegistrationResponse, Record<string, any>, number>): Promise<Response<AuthMethodVerifyRegistrationResponse, Record<string, any>, number>>;
export declare function googleOAuthVerifyToFetchPKPsHandler(req: Request<{}, AuthMethodVerifyToFetchResponse, GoogleOAuthVerifyRegistrationRequest, ParsedQs, Record<string, any>>, res: Response<AuthMethodVerifyToFetchResponse, Record<string, any>, number>): Promise<Response<AuthMethodVerifyToFetchResponse, Record<string, any>, number>>;
