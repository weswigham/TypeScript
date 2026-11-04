//// [tests/cases/conformance/lint/rules/no-debugger/noDebuggerValid.ts] ////

//// [input.ts]
const value = { debugger: 1 };
value.debugger;
value["debugger"];
const text = "debugger;";
const template = `debugger;`;
const pattern = /debugger/;
// debugger;
/* debugger; */

//// [input.ts]
const value = { debugger: 1 };
value.debugger;
value["debugger"];
const text = "debugger;";
const template = `debugger;`;
const pattern = /debugger/;
// debugger;
/* debugger; */
