import { Response } from "express-serve-static-core";

export async function health(res: Response) {
	return res.status(200);
}
