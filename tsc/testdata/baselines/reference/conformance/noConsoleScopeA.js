//// [tests/cases/conformance/lint/rules/no-console/noConsoleScopeA.ts] ////

//// [input.ts]
console.log(value);
use(console.info);
console[key]();
console?.log(value);
console.warn(value);
console["error"](value);
function shadow(console: any) { console.log(value); }

//// [input.ts]
console.log(value);
use(console.info);
console[key]();
console?.log(value);
console.warn(value);
console["error"](value);
function shadow(console: any) { console.log(value); }
