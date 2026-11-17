//// [tests/cases/conformance/lint/rules/vars-on-top/lintVarsOnTopCoreDFunctionFooDirectiveLetFirstVarSecondClassCStaticLetFirstVarSecond.ts] ////

//// [input.ts]
function foo() { 'directive'; let first; var second; } class C { static { let first; var second; } }

//// [input.ts]
function foo() { 'directive'; let first; var second; } class C { static { let first; var second; } }
