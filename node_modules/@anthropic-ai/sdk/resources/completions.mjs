// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from '@anthropic-ai/sdk/resource';
export class Completions extends APIResource {
    create(body, options) {
        return this._client.post('/v1/complete', {
            body,
            timeout: 600000,
            ...options,
            stream: body.stream ?? false,
        });
    }
}
(function (Completions) {
})(Completions || (Completions = {}));
//# sourceMappingURL=completions.mjs.map