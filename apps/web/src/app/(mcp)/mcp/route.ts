import { createMcpRoute } from "@repo/api/mcp";

/**
 * The MCP server (Streamable HTTP) at /mcp. Claude, ChatGPT, Cursor and the
 * MCP Inspector sign the user in through OAuth; scripts can send an API key.
 * The tools come from the API's operations (packages/api).
 */
const handler = createMcpRoute();

export {
	handler as DELETE,
	handler as GET,
	handler as OPTIONS,
	handler as POST,
};
