//// [tests/cases/conformance/lint/rules/no-caller/lintNoCallerStatementRulesCaller.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
arguments.callee; arguments.caller; arguments?.callee; (arguments).caller;

//// [input.ts]
arguments.callee; arguments.caller; arguments?.callee; (arguments).caller;
