//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1692.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { if (foo) { return; } throw err; } }
