//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1434.ts] ////

//// [input.ts]
function someFunc() { do { switch (foo) { case 1: something(); default: return; } } while (a) }

//// [input.ts]
function someFunc() { do { switch (foo) { case 1: something(); default: return; } } while (a) }
