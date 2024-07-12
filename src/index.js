"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
async function handler(event) {
    var _a, _b;
    const number = (_b = (_a = event.queryStringParameters) === null || _a === void 0 ? void 0 : _a.number) !== null && _b !== void 0 ? _b : 1;
    const result = Number(number) * Number(number);
    return {
        statusCode: 200,
        body: JSON.stringify({ result })
    };
}
exports.handler = handler;
