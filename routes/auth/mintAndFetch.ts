import { Request } from "express";
import { Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import {
	getPKPsForAuthMethod,
	getPkpEthAddress,
	getProvider,
	getSigner,
	mintPKPV2,
} from "../../lit";
import {
	AuthMethodVerifyToFetchResponse,
	FetchRequest,
	MintNextAndAddAuthMethodsRequest,
	MintNextAndAddAuthMethodsResponse,
} from "../../models";
import { getTokenIdFromTransferEvent } from "../../utils/receipt";
import { utils } from "ethers";

export async function mintNextAndAddAuthMethodsHandler(
	req: Request<
		{},
		MintNextAndAddAuthMethodsResponse,
		MintNextAndAddAuthMethodsRequest,
		ParsedQs,
		Record<string, any>
	>,
	res: Response<
		MintNextAndAddAuthMethodsResponse,
		Record<string, any>,
		number
	>,
) {
	// mint PKP for user
	try {
		const mintTx = await mintPKPV2(req.body);
		console.info("Minted PKP", {
			requestId: mintTx.hash,
		});
		airdropLitTokens(mintTx.hash!);
		return res.status(200).json({
			requestId: mintTx.hash,
		});
	} catch (err) {
		console.error("Unable to mint PKP", {
			err,
		});
		return res.status(500).json({
			error: `Unable to mint PKP`,
		});
	}
}

async function airdropLitTokens(requestId: string) {
	console.debug("Airdropping LIT tokens");
	const provider = getProvider();
	console.debug("airdrop provider", provider);
	const mintReceipt = await provider.waitForTransaction(requestId, 1, 30000);
	console.debug("Mint Receipt", JSON.stringify(mintReceipt));
	const tokenIdFromEvent = await getTokenIdFromTransferEvent(mintReceipt);
	console.debug("Token ID from event", tokenIdFromEvent);
	const pkpEthAddress = await getPkpEthAddress(tokenIdFromEvent);
	console.debug("PKP Eth Address", pkpEthAddress);
	const signer = getSigner();
	console.debug("Signer", signer);
	const tx = await signer.sendTransaction({
		to: pkpEthAddress,
		value: utils.parseEther("0.000001"),
	});
	console.debug("Airdrop transaction", JSON.stringify(tx));
	await tx.wait();
	console.debug("Airdrop transaction mined", JSON.stringify(tx));
}

// Fetch PKPs for verified Discord account
export async function fetchPKPsHandler(
	req: Request<
		{},
		AuthMethodVerifyToFetchResponse,
		FetchRequest,
		ParsedQs,
		Record<string, any>
	>,
	res: Response<AuthMethodVerifyToFetchResponse, Record<string, any>, number>,
) {
	// get Discord access token from body
	const { authMethodType, authMethodId } = req.body;

	try {
		const pkps = await getPKPsForAuthMethod({
			authMethodType: authMethodType,
			idForAuthMethod: authMethodId,
		});
		console.info("Fetched PKPs with auth type", authMethodType, {
			pkps: pkps,
		});
		return res.status(200).json({
			pkps: pkps,
		});
	} catch (err) {
		console.error(
			`Unable to fetch PKPs for given auth type ${authMethodType}`,
			{
				err,
			},
		);
		return res.status(500).json({
			error: `Unable to fetch PKPs for given auth method type: ${authMethodType}`,
		});
	}
}
