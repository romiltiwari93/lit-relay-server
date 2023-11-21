import { Request } from "express";
import { Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { GetClaimableRequestParams, GetClaimableResponse } from "../../models";
import { LitNodeClientNodeJs } from "@lit-protocol/lit-node-client-nodejs";
import config from "../../config";
import { computeAddress } from "ethers/lib/utils";

export async function resolvePhone(
	req: Request<
		GetClaimableRequestParams,
		GetClaimableResponse,
		{},
		ParsedQs,
		Record<string, any>
	>,
	res: Response<GetClaimableResponse, Record<string, any>, number>,
) {
	// get requestId from params
	const { stytchUserId } = req.params;
	try {
		//connect to the lit nodes
		const litNodeClient = new LitNodeClientNodeJs({
			litNetwork: "cayenne",
			debug: true,
		});
		await litNodeClient.connect();
		const keyId = litNodeClient.computeHDKeyId(
			stytchUserId,
			config.stytchProjectId,
		);
		console.log(`/claimable/phone: keyId: ${keyId}`);
		const pkpPublicKey = litNodeClient.computeHDPubKey(
			keyId.replace("0x", ""),
		);
		console.log(`/claimable/phone: claimablePubKey: ${pkpPublicKey}`);
		const claimablePubKeyBuffer = Buffer.from(pkpPublicKey, "hex");
		const pkpEthAddress = computeAddress(claimablePubKeyBuffer);
		console.log(`/claimable/phone: claimableEthAddress: ${pkpEthAddress}`);

		return res.status(200).json({
			stytchUserId,
			pkpEthAddress,
			pkpPublicKey: `0x${pkpPublicKey}`,
		});
	} catch (err) {
		console.error("Error resolving phone number to eth address", {
			stytchUserId,
			err,
		});
		return res.status(500).json({
			error: "Unable to fetch PKP information",
		});
	}
}
