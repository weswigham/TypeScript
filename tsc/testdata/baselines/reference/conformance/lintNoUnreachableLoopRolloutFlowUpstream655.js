//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream655.ts] ////

//// [input.ts]
function someFunc() { do { switch (foo) { case 1: return; } } while (a && b) }

//// [input.ts]
function someFunc() { do { switch (foo) { case 1: return; } } while (a && b) }
