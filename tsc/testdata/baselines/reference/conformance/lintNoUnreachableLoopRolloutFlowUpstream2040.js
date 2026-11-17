//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2040.ts] ////

//// [input.ts]
function someFunc() { for (a of b) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (a of b) { if (foo) { return; } throw err; } }
