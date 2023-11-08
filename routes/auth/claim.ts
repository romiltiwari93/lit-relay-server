import { Request } from "express";
import { Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { AuthMethodVerifyRegistrationResponse, Claim } from "../../models";
import { claimPKP, getPkpEthAddress, getProvider, getSigner } from "../../lit";
import { getTokenIdFromTransferEvent } from "../../utils/receipt";
import { utils } from "ethers";

export async function mintClaimedKeyId(
	req: Request<
		{},
		AuthMethodVerifyRegistrationResponse,
		Claim,
		ParsedQs,
		Record<string, any>
	>,
	res: Response<
		AuthMethodVerifyRegistrationResponse,
		Record<string, any>,
		number
	>,
) {
	console.info("mintClaimedKeyId: ", req.body);
	console.debug(`mintClaimedKeyId: ---- ${JSON.stringify(req.body)}`);
	const { derivedKeyId, authMethodType, signatures } = req.body;
	try {
		let mintTx = await claimPKP({
			keyId: derivedKeyId,
			signatures,
			authMethodType,
			authMethodId: derivedKeyId,
			authMethodPubkey: "0x",
		});
		console.info("claimed key id: transaction hash (request id): ", {
			requestId: mintTx.transactionHash,
		});
		//airdrop LIT tokens that the user needs to add google and webauthn as authMethods on the claimed PKP
		airdropLitTokens(mintTx.transactionHash);
		return res.status(200).json({
			requestId: mintTx.transactionHash,
		});
	} catch (e) {
		console.error("Unable to claim key with key id: ", derivedKeyId, e);
		return res.status(500).json({
			error: `Unable to claim key with derived id: ${derivedKeyId}`,
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
		value: utils.parseEther("0.000002"),
	});
	console.debug("Airdrop transaction", JSON.stringify(tx));
	await tx.wait();
	console.debug("Airdrop transaction mined", JSON.stringify(tx));
}
