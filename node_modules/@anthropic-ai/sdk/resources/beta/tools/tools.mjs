// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from '@anthropic-ai/sdk/resource';
import * as MessagesAPI from '@anthropic-ai/sdk/resources/beta/tools/messages';
export class Tools extends APIResource {
    constructor() {
        super(...arguments);
        this.messages = new MessagesAPI.Messages(this._client);
    }
}
(function (Tools) {
    Tools.Messages = MessagesAPI.Messages;
})(Tools || (Tools = {}));
//# sourceMappingURL=tools.mjs.map