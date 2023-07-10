import { Request } from "express";
import { Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { DiscordOAuthVerifyRegistrationRequest, AuthMethodVerifyRegistrationResponse, AuthMethodVerifyToFetchResponse } from "../../models";
export declare function discordOAuthVerifyToMintHandler(req: Request<{}, AuthMethodVerifyRegistrationResponse, DiscordOAuthVerifyRegistrationRequest, ParsedQs, Record<string, any>>, res: Response<AuthMethodVerifyRegistrationResponse, Record<string, any>, number>): Promise<Response<AuthMethodVerifyRegistrationResponse, Record<string, any>, number>>;
export declare function discordOAuthVerifyToFetchPKPsHandler(req: Request<{}, AuthMethodVerifyToFetchResponse, DiscordOAuthVerifyRegistrationRequest, ParsedQs, Record<string, any>>, res: Response<AuthMethodVerifyToFetchResponse, Record<string, any>, number>): Promise<Response<AuthMethodVerifyToFetchResponse, Record<string, any>, number>>;
