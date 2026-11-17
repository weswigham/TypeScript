//// [tests/cases/conformance/lint/rules/prefer-rest-params/lintPreferRestParamsCoreScopeCReportsFunctionFArgumentsArguments0ArgumentsLengthArguments1.ts] ////

//// [input.ts]
function f() { arguments; arguments[0]; arguments.length; (() => arguments[1])(); }

//// [input.ts]
function f() { arguments; arguments[0]; arguments.length; (() => arguments[1])(); }
