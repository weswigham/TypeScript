//// [tests/cases/conformance/lint/rules/prefer-object-has-own/lintPreferObjectHasOwnCoreScopeCFixesFunctionFYieldHasOwnPropertyCallObjKey.ts] ////

//// [input.ts]
function* f() { yield({}).hasOwnProperty.call(obj, key); }

//// [input.ts]
function* f() { yield Object.hasOwn(obj, key); }
