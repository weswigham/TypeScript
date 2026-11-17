//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1161.ts] ////

//// [input.ts]
function someFunc() { for (var a in b) { switch (foo) { case 1: continue; default: return; } throw err; } }

//// [input.ts]
function someFunc() { for (var a in b) { switch (foo) { case 1: continue; default: return; } throw err; } }
