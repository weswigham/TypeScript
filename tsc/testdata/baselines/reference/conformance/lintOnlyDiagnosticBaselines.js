//// [tests/cases/conformance/lint/lintOnlyDiagnosticBaselines.ts] ////

//// [input.ts]
const value: number = "text";
debugger;
console.log(value);


//// [input.ts]
const value: number = "text";
;
console.log(value);
