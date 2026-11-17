//// [tests/cases/conformance/lint/rules/no-caller/lintNoCallerStatementRulesCallerSyntactic.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
function test(arguments) { arguments.callee; }

//// [input.ts]
function test(arguments) { arguments.callee; }
