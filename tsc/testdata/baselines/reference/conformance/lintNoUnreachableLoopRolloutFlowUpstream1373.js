//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1373.ts] ////

//// [input.ts]
function someFunc() { while (a) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { while (a) { if (foo) { return; } throw err; } }
