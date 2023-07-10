"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenIdFromTransferEvent = void 0;
const TRANSFER_EVENT_SIGNATURE = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
async function getTokenIdFromTransferEvent(receipt) {
    // Filter for the Transfer event.
    const transferEventLog = receipt.logs.find((log) => {
        return (log.topics.length > 0 && log.topics[0] === TRANSFER_EVENT_SIGNATURE);
    });
    // Validation
    if (!transferEventLog) {
        throw new Error("No Transfer event found in receipt");
    }
    if (transferEventLog.topics.length < 3) {
        throw new Error("Transfer event does not have enough topics");
    }
    return transferEventLog.topics[3];
}
exports.getTokenIdFromTransferEvent = getTokenIdFromTransferEvent;
//# sourceMappingURL=receipt.js.map