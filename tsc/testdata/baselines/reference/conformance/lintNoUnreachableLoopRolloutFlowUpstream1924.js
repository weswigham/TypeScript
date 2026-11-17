//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1924.ts] ////

//// [input.ts]
function someFunc() { for (a in b) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (a in b) { if (foo) { return; } throw err; } }
