//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1460.ts] ////

//// [input.ts]
function someFunc() { do { if (foo) { return; } throw err; } while (a && b) }

//// [input.ts]
function someFunc() { do { if (foo) { return; } throw err; } while (a && b) }
