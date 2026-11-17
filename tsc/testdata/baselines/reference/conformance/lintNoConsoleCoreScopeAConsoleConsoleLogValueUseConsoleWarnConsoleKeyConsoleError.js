//// [tests/cases/conformance/lint/rules/no-console/lintNoConsoleCoreScopeAConsoleConsoleLogValueUseConsoleWarnConsoleKeyConsoleError.ts] ////

//// [input.ts]
console.log(value); use(console.warn); console[key](); console?.error();

//// [input.ts]
console.log(value); use(console.warn); console[key](); console?.error();
