//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1217.ts] ////

//// [input.ts]
function someFunc() { for (a of b) { switch (foo) { case 1: continue; default: return; } throw err; } }

//// [input.ts]
function someFunc() { for (a of b) { switch (foo) { case 1: continue; default: return; } throw err; } }
