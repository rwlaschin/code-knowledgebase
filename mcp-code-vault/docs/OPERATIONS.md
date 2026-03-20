# Operations notes

## Known issues

### Shutdown: primary does not stop by itself

When the MCP client (e.g. Cursor’s MCP) is stopped, the **primary** process (the one that took over as primary, e.g. `npm run dev` on port 3100) keeps running and does not shut down on its own. The user cannot reliably stop it via Ctrl+C or closing the terminal; the process may need to be killed by port (e.g. `lsof -i :3100` then `kill <pid>`).

**Desired behavior:** The primary should stop by itself when appropriate (e.g. when the MCP client disconnects, or when explicitly requested), so the user does not have to force-kill the process.

**Workaround:** Kill the process bound to the primary’s port: `kill $(lsof -t -i :<PORT>)` (use the port your primary is using, e.g. 3100).
