//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream769.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; c++) { switch (foo) { case 1: continue; default: return; } throw err; } }

//// [input.ts]
function someFunc() { for (; b < foo; c++) { switch (foo) { case 1: continue; default: return; } throw err; } }
