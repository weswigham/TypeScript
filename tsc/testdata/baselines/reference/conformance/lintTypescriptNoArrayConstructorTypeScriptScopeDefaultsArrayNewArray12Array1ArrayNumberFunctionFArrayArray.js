//// [tests/cases/conformance/lint/rules/no-array-constructor/lintTypescriptNoArrayConstructorTypeScriptScopeDefaultsArrayNewArray12Array1ArrayNumberFunctionFArrayArray.ts] ////

//// [input.ts]
Array(); new Array(1, 2); Array(1); Array<number>(); function f(Array) { Array(); }

//// [input.ts]
[]; [1, 2]; Array(1); Array<number>(); function f(Array) { []; }
