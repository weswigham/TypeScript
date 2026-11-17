//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream937.ts] ////

//// [input.ts]
function someFunc() { for (; ; c++) { switch (foo) { case 1: continue; default: return; } throw err; } }

//// [input.ts]
function someFunc() { for (; ; c++) { switch (foo) { case 1: continue; default: return; } throw err; } }
