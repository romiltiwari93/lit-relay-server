import { URL } from "url";

export function getDomainFromUrl(url: string) {
	//remove protocol from origin
	const removedProtocolOrigin = url.replace(/(^\w+:|^)\/\//, "");
	//remove port from origin
	return removedProtocolOrigin.replace(/:\d+$/, "");
}
