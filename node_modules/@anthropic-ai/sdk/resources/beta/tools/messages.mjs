// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from '@anthropic-ai/sdk/resource';
export class Messages extends APIResource {
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
(function (Messages) {
})(Messages || (Messages = {}));
//# sourceMappingURL=messages.mjs.map