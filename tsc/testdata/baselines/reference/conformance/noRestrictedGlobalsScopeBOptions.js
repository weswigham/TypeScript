//// [tests/cases/conformance/lint/rules/no-restricted-globals/noRestrictedGlobalsScopeBOptions.ts] ////

//// [input.ts]
window.event;
globalThis.globalThis["event"];
self?.self.event;
function shadow(window) { window.event; }
object.window.event;

//// [input.ts]
window.event;
globalThis.globalThis["event"];
self?.self.event;
function shadow(window) { window.event; }
object.window.event;
