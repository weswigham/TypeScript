//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1779.ts] ////

//// [input.ts]
function someFunc() { for (; b;) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (; b;) { if (foo) { return; } throw err; } }
