{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": [
        "mcp-server-fetch"
      ],
      "env": {},
      "disabled": false,
      "autoApprove": []
    },
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest"
      ],
      "disabled": false
    },
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp"
      ],
      "disabled": false,
      "autoApprove": [
        "resolve-library-id",
        "get-library-docs"
      ]
    },
    "mongodb-mcp-server": {
      "command": "npx",
      "args": [
        "-y", 
        "mongodb-mcp-server@latest", 
        "--readOnly"
      ],
      "env": {
        "MDB_MCP_CONNECTION_STRING": "mongodb://localhost:27017"
      },
      "disabled": false
    }
  }
}