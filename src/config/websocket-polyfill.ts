/**
 * Polyfill WebSocket for Node.js < 22.
 * Supabase realtime-js requires WebSocket support.
 * This imports the 'ws' package and assigns it globally
 * so Supabase can use it automatically.
 */
import ws from "ws";

if (typeof globalThis.WebSocket === "undefined") {
  (globalThis as any).WebSocket = ws;
}
