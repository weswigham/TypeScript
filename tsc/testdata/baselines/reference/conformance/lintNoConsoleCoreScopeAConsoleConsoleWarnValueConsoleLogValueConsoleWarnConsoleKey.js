//// [tests/cases/conformance/lint/rules/no-console/lintNoConsoleCoreScopeAConsoleConsoleWarnValueConsoleLogValueConsoleWarnConsoleKey.ts] ////

//// [input.ts]
console.warn(value); console['log'](value); console[`warn`](); console[key]();

//// [input.ts]
console.warn(value); console['log'](value); console[`warn`](); console[key]();
