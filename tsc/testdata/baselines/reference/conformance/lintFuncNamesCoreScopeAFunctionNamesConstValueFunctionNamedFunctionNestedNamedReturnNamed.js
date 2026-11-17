//// [tests/cases/conformance/lint/rules/func-names/lintFuncNamesCoreScopeAFunctionNamesConstValueFunctionNamedFunctionNestedNamedReturnNamed.ts] ////

//// [input.ts]
const value = function named() { function nested(named) { return named(); } };

//// [input.ts]
const value = function named() { function nested(named) { return named(); } };
