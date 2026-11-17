//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream601.ts] ////

//// [input.ts]
function someFunc() { while (a && b) { switch (foo) { case 1: continue; default: return; } throw err; } }

//// [input.ts]
function someFunc() { while (a && b) { switch (foo) { case 1: continue; default: return; } throw err; } }
