//// [tests/cases/conformance/lint/rules/no-caller/lintNoCallerStatementRulesCallerComputed.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
arguments['callee']; arguments[`caller`]; arguments[caller]; arguments.length; other.caller;

//// [input.ts]
arguments['callee']; arguments[`caller`]; arguments[caller]; arguments.length; other.caller;
