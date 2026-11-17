//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream823.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ; c++) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (a = 0; ; c++) { switch (foo) { case 1: return; } } }
