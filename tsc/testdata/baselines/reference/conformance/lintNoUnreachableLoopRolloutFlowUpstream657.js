//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream657.ts] ////

//// [input.ts]
function someFunc() { do { switch (foo) { case 1: continue; default: return; } throw err; } while (a && b) }

//// [input.ts]
function someFunc() { do { switch (foo) { case 1: continue; default: return; } throw err; } while (a && b) }
