// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-restricted-globals":["error",{"globals":["event"],"checkGlobalObject":true,"globalObjects":["custom"]}]}},"files":["input.ts"]}
// @filename: input.ts
window.event;
globalThis.globalThis["event"];
self?.self.event;
function shadow(window) { window.event; }
object.window.event;