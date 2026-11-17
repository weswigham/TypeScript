//// [tests/cases/conformance/lint/rules/no-console/lintNoConsoleCoreScopeAConsoleConsoleLogValueLetConsoleConsoleLogValue.ts] ////

//// [input.ts]
console.log(value); { let console; console.log(value); }

//// [input.ts]
console.log(value); { let console; console.log(value); }
