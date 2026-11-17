//// [tests/cases/conformance/lint/rules/no-setter-return/lintNoSetterReturnCoreCFunctionFObjectObjectDefinePropertyFooBarSetValReturn1.ts] ////

//// [input.ts]
function f(Object) { Object.defineProperty(foo, 'bar', {set(val) {return 1;}}); }

//// [input.ts]
function f(Object) { Object.defineProperty(foo, 'bar', {set(val) {return 1;}}); }
