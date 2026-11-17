//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream627.ts] ////

//// [input.ts]
function someFunc() { do { switch (foo) { case 1: return; } } while (a) }

//// [input.ts]
function someFunc() { do { switch (foo) { case 1: return; } } while (a) }
