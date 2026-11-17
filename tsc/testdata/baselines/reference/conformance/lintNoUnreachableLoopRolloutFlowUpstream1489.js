//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1489.ts] ////

//// [input.ts]
function someFunc() { for (a; b; c) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (a; b; c) { if (foo) { return; } throw err; } }
