//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1431.ts] ////

//// [input.ts]
function someFunc() { do { if (foo) { return; } throw err; } while (a) }

//// [input.ts]
function someFunc() { do { if (foo) { return; } throw err; } while (a) }
