//// [tests/cases/conformance/lint/rules/no-restricted-globals/lintNoRestrictedGlobalsCoreScopeBRestrictedGlobalObjects.ts] ////

//// [input.ts]
window.event; globalThis.globalThis['event']; function run(window) { window.event; }

//// [input.ts]
window.event; globalThis.globalThis['event']; function run(window) { window.event; }
