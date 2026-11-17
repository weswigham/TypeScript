//// [tests/cases/conformance/lint/rules/func-names/lintFuncNamesCoreScopeAFunctionNamesFunctionTestValueFunctionConstKeyLocalFunctionObjectValueFunctionArrayValue.ts] ////

//// [input.ts]
function test(value = function() {}) {} const { key: local = function() {} } = object; [value = function() {}] = array; ({ value = function() {} } = object);

//// [input.ts]
function test(value = function() {}) {} const { key: local = function() {} } = object; [value = function() {}] = array; ({ value = function() {} } = object);
