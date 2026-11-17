//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1808.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; ) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (; b < foo; ) { if (foo) { return; } throw err; } }
