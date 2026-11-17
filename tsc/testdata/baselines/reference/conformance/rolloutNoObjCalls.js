//// [tests/cases/conformance/lint/rules/no-obj-calls/rolloutNoObjCalls.ts] ////

//// [input.ts]
Math();
new JSON();
Intl?.();
globalThis.Math();
const alias = condition ? other : Reflect;
alias();
const { JSON: json } = globalThis;
new json();
Math.random();
function shadow(Math) { Math(); }

//// [input.ts]
Math();
new JSON();
Intl?.();
globalThis.Math();
const alias = condition ? other : Reflect;
alias();
const { JSON: json } = globalThis;
new json();
Math.random();
function shadow(Math) { Math(); }
