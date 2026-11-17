//// [tests/cases/conformance/lint/rules/complexity/lintComplexityCoreScopeAFunctionTestA0ConstB0Value.ts] ////

//// [input.ts]
function test(a = 0) { const [{ b = 0 } = {}] = value; }

//// [input.ts]
function test(a = 0) { const [{ b = 0 } = {}] = value; }
