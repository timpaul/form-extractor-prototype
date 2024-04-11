"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Messages = exports.MessageStream = void 0;
const resource_1 = require("@anthropic-ai/sdk/resource");
const MessageStream_1 = require("@anthropic-ai/sdk/lib/MessageStream");
var MessageStream_2 = require("@anthropic-ai/sdk/lib/MessageStream");
Object.defineProperty(exports, "MessageStream", { enumerable: true, get: function () { return MessageStream_2.MessageStream; } });
class Messages extends resource_1.APIResource {
    create(body, options) {
        return this._client.post('/v1/messages', {
            body,
            timeout: 600000,
            ...options,
            stream: body.stream ?? false,
        });
    }
    /**
     * Create a Message stream
     */
    stream(body, options) {
        return MessageStream_1.MessageStream.createMessage(this, body, options);
    }
}
exports.Messages = Messages;
(function (Messages) {
})(Messages = exports.Messages || (exports.Messages = {}));
//# sourceMappingURL=messages.js.map