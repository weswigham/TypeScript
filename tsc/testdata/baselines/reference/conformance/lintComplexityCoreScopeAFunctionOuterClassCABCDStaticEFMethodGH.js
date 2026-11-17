//// [tests/cases/conformance/lint/rules/complexity/lintComplexityCoreScopeAFunctionOuterClassCABCDStaticEFMethodGH.ts] ////

//// [input.ts]
function outer() { class C { [a || b] = c || d; static { e || f; } method() { g || h; } } }

//// [input.ts]
function outer() { class C { [a || b] = c || d; static { e || f; } method() { g || h; } } }
