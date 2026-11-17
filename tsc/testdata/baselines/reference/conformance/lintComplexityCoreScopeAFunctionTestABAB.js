//// [tests/cases/conformance/lint/rules/complexity/lintComplexityCoreScopeAFunctionTestABAB.ts] ////

//// [input.ts]
function test() { a?.b?.(); a ??= b; }

//// [input.ts]
function test() { a?.b?.(); a ??= b; }
