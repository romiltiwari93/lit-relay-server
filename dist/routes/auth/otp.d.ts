import { Request } from "express";
import { Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { AuthMethodVerifyRegistrationResponse, AuthMethodVerifyToFetchResponse, OTPAuthVerifyRegistrationRequest } from "../../models";
export declare function otpVerifyToMintHandler(req: Request<{}, AuthMethodVerifyRegistrationResponse, OTPAuthVerifyRegistrationRequest, ParsedQs, Record<string, any>>, res: Response<AuthMethodVerifyRegistrationResponse, Record<string, any>, number>): Promise<Response<AuthMethodVerifyRegistrationResponse, Record<string, any>, number>>;
export declare function otpVerifyToFetchPKPsHandler(req: Request<{}, AuthMethodVerifyToFetchResponse, OTPAuthVerifyRegistrationRequest, ParsedQs, Record<string, any>>, res: Response<AuthMethodVerifyToFetchResponse, Record<string, any>, number>): Promise<Response<AuthMethodVerifyToFetchResponse, Record<string, any>, number>>;
