//// [tests/cases/conformance/lint/rules/func-names/lintFuncNamesCoreScopeAFunctionNamesObjectMethodFunctionUseFunctionExportDefaultFunction.ts] ////

//// [input.ts]
object.method = function() {}; use(function() {}); export default function() {}

//// [input.ts]
object.method = function() {}; use(function() {}); export default function() {}
