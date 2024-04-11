// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from '@anthropic-ai/sdk/resource';
import { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';
export { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';
export class Messages extends APIResource {
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
        return MessageStream.createMessage(this, body, options);
    }
}
(function (Messages) {
})(Messages || (Messages = {}));
//# sourceMappingURL=messages.mjs.map