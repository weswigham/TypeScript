//// [tests/cases/conformance/lint/rules/complexity/lintComplexityCoreScopeAFunctionOuterFunctionNestedIfAFunctionOtherWhileB.ts] ////

//// [input.ts]
function outer() { function nested() { if (a) {} } function other() { while (b) {} } }

//// [input.ts]
function outer() { function nested() { if (a) {} } function other() { while (b) {} } }
