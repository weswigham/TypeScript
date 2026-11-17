//// [tests/cases/conformance/lint/rules/complexity/lintComplexityCoreScopeAFunctionOuterClassCABCDEStaticFGHIJ.ts] ////

//// [input.ts]
function outer() { class C { [a || b] = c || d || e; static { f || g || h; } } i || j; }

//// [input.ts]
function outer() { class C { [a || b] = c || d || e; static { f || g || h; } } i || j; }
