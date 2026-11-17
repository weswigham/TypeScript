//// [tests/cases/conformance/lint/rules/func-names/lintFuncNamesCoreScopeAFunctionNamesConstValueFunctionMethodFunctionClassCFieldFunction.ts] ////

//// [input.ts]
const value = function() {}; ({ method: function() {} }); class C { field = function() {}; }

//// [input.ts]
const value = function() {}; ({ method: function() {} }); class C { field = function() {}; }
