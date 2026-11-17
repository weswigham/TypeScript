//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream654.ts] ////

//// [input.ts]
function someFunc() { do { if (foo) { continue; } return; } while (a && b) }

//// [input.ts]
function someFunc() { do { if (foo) { continue; } return; } while (a && b) }
