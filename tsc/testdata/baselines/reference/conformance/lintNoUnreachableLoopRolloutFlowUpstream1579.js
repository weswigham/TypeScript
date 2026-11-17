//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1579.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; c++) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
function someFunc() { for (; b < foo; c++) { switch (foo) { case 1: something(); default: return; } } }
