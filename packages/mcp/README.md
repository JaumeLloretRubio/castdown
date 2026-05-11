# castdown-mcp

MCP server bridging clients (Claude Desktop, Cursor, Windsurf, Zed, ...) to a running
castdown API gateway. Communicates over stdio.

## Install via your MCP client

Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "castdown": {
      "command": "npx",
      "args": ["-y", "castdown-mcp"],
      "env": {
        "CASTDOWN_API_URL": "http://localhost:3001",
        "CASTDOWN_API_KEY": "cd_dev_changeme"
      }
    }
  }
}
```

Cursor: same shape under `~/.cursor/mcp.json`. Windsurf: `~/.codeium/windsurf/mcp_config.json`.

## Tools

| tool | input | output |
|---|---|---|
| `cast_file` | `{ path, skip_cleaners?, raw? }` | `{ markdown, meta }` |
| `render_markdown` | `{ markdown, target, template?, output_path? }` | `{ output_path, size_bytes, target }` |
| `fetch_page` | `{ url }` | JSON page listing |
| `crawl_url` | `{ url, depth?, max_pages?, output_path? }` | `{ output_path (zip), size_bytes, root_url }` |

`cast_file` returns the cleaned Markdown directly. `render_markdown` and `crawl_url`
write the binary to disk (default `/tmp`) and return the path, because MCP responses
are JSON text.

## Local dev (without publishing)

```bash
pnpm -F castdown-mcp install
pnpm -F castdown-mcp build
# Point the MCP client at the absolute path of dist/index.js, or
# add it as a custom command with `node /path/to/dist/index.js`.
```

## Errors

The server never writes to stdout except MCP protocol frames. All logs go to stderr
prefixed with `[castdown-mcp]`. If the gateway returns non-2xx, the tool result
`isError` flag is set and the message is included in the `text` content.
