// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from '@anthropic-ai/sdk/resource';
import * as ToolsAPI from '@anthropic-ai/sdk/resources/beta/tools/tools';
export class Beta extends APIResource {
    constructor() {
        super(...arguments);
        this.tools = new ToolsAPI.Tools(this._client);
    }
}
(function (Beta) {
    Beta.Tools = ToolsAPI.Tools;
})(Beta || (Beta = {}));
//# sourceMappingURL=beta.mjs.map