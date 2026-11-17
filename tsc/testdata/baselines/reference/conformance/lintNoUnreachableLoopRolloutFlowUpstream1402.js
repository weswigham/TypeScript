//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1402.ts] ////

//// [input.ts]
function someFunc() { while (a && b) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { while (a && b) { if (foo) { return; } throw err; } }
