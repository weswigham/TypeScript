//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1866.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ;) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (a = 0; ;) { if (foo) { return; } throw err; } }
