//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1637.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ; c++) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
function someFunc() { for (a = 0; ; c++) { switch (foo) { case 1: something(); default: return; } } }
