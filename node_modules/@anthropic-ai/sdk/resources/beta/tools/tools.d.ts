import { APIResource } from '@anthropic-ai/sdk/resource';
import * as MessagesAPI from '@anthropic-ai/sdk/resources/beta/tools/messages';
export declare class Tools extends APIResource {
    messages: MessagesAPI.Messages;
}
export declare namespace Tools {
    export import Messages = MessagesAPI.Messages;
    export import Tool = MessagesAPI.Tool;
    export import ToolResultBlockParam = MessagesAPI.ToolResultBlockParam;
    export import ToolUseBlock = MessagesAPI.ToolUseBlock;
    export import ToolUseBlockParam = MessagesAPI.ToolUseBlockParam;
    export import ToolsBetaContentBlock = MessagesAPI.ToolsBetaContentBlock;
    export import ToolsBetaMessage = MessagesAPI.ToolsBetaMessage;
    export import ToolsBetaMessageParam = MessagesAPI.ToolsBetaMessageParam;
    export import MessageCreateParams = MessagesAPI.MessageCreateParams;
    export import MessageCreateParamsNonStreaming = MessagesAPI.MessageCreateParamsNonStreaming;
    export import MessageCreateParamsStreaming = MessagesAPI.MessageCreateParamsStreaming;
}
//# sourceMappingURL=tools.d.ts.map