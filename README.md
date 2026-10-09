# Socialclip.art

## KI-Videos mit Claude (Short Video Maker)

Kostenloser MCP-Server, der kurze Videos (TikTok, Reels, Shorts) aus Text erstellt: Sprecherstimme, Untertitel, Stock-Videos von Pexels und Musik.

1. Kostenlosen Pexels-API-Key holen: https://www.pexels.com/api/
2. Server starten (Docker nötig):
   ```bash
   PEXELS_API_KEY=dein_key docker compose -f docker-compose.short-video-maker.yml up -d
   ```
3. Claude Code in diesem Ordner starten und den Server `short-video-maker` freigeben (steht in `.mcp.json`).
   Für Claude Desktop in `claude_desktop_config.json` eintragen:
   ```json
   { "mcpServers": { "short-video-maker": { "command": "npx", "args": ["-y", "mcp-remote", "http://localhost:3123/mcp/sse"] } } }
   ```

Fertige Videos landen in `./videos`, eine Weboberfläche gibt es unter http://localhost:3123.
