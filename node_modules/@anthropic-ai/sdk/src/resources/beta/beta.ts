// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from "../../resource";
import * as ToolsAPI from "./tools/tools";

export class Beta extends APIResource {
  tools: ToolsAPI.Tools = new ToolsAPI.Tools(this._client);
}

export namespace Beta {
  export import Tools = ToolsAPI.Tools;
}
