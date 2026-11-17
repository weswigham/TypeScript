//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream493.ts] ////

//// [input.ts]
function foo() { return bar(); function bar() { return 1; } }

//// [input.ts]
function foo() { return bar(); function bar() { return 1; } }
