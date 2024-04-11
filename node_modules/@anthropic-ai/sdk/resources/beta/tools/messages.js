"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Messages = void 0;
const resource_1 = require("@anthropic-ai/sdk/resource");
class Messages extends resource_1.APIResource {
    create(body, options) {
        return this._client.post('/v1/messages?beta=tools', {
            body,
            timeout: 600000,
            ...options,
            headers: { 'anthropic-beta': 'tools-2024-04-04', ...options?.headers },
            stream: body.stream ?? false,
        });
    }
}
exports.Messages = Messages;
(function (Messages) {
})(Messages = exports.Messages || (exports.Messages = {}));
//# sourceMappingURL=messages.js.map