"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDomainFromUrl = void 0;
const url_1 = require("url");
function getDomainFromUrl(url) {
    const parsedUrl = new url_1.URL(url);
    return parsedUrl.hostname;
}
exports.getDomainFromUrl = getDomainFromUrl;
//# sourceMappingURL=string.js.map