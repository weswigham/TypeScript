//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1273.ts] ////

//// [input.ts]
function someFunc() { for ({ a, b } of c) { switch (foo) { case 1: continue; default: return; } throw err; } }

//// [input.ts]
function someFunc() { for ({ a, b } of c) { switch (foo) { case 1: continue; default: return; } throw err; } }
