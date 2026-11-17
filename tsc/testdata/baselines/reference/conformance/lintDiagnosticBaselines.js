//// [tests/cases/conformance/lint/lintDiagnosticBaselines.ts] ////

//// [input.ts]
const value: number = "text";
debugger;
console.log(value);


//// [input.js]
"use strict";
const value = "text";
debugger;
console.log(value);
