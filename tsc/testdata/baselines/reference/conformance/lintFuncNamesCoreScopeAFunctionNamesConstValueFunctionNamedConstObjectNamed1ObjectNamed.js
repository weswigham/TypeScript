//// [tests/cases/conformance/lint/rules/func-names/lintFuncNamesCoreScopeAFunctionNamesConstValueFunctionNamedConstObjectNamed1ObjectNamed.ts] ////

//// [input.ts]
const value = function named() { const object = { named: 1 }; object.named; };

//// [input.ts]
const value = function named() { const object = { named: 1 }; object.named; };
