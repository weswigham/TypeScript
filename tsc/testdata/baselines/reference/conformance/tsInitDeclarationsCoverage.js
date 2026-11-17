//// [tests/cases/conformance/lint/rules/init-declarations/tsInitDeclarationsCoverage.ts] ////

//// [input.ts]
let missing: number;
var alsoMissing: string;
let initialized = 1;
const constant = 2;
declare let ambient: number;
declare namespace Ambient { let value: number; }
for (const item of [1, 2]) { void item; }
for (const key in { value: 1 }) { void key; }
export {};

//// [input.ts]
let missing: number;
var alsoMissing: string;
let initialized = 1;
const constant = 2;
declare let ambient: number;
declare namespace Ambient { let value: number; }
for (const item of [1, 2]) { void item; }
for (const key in { value: 1 }) { void key; }
export {};
