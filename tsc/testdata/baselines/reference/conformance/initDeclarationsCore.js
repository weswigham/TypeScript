//// [tests/cases/conformance/lint/rules/init-declarations/initDeclarationsCore.ts] ////

//// [input.ts]
let missing: number;
let initialized = 1;
for (let index; false;) {}
for (const key in object) {}
declare let ambient: number;
declare namespace Ambient { let value: number; }

//// [input.ts]
let missing: number;
let initialized = 1;
for (let index; false;) {}
for (const key in object) {}
declare let ambient: number;
declare namespace Ambient { let value: number; }
