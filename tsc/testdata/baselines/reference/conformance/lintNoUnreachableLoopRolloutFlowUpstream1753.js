//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1753.ts] ////

//// [input.ts]
function someFunc() { for (; ; c++) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
function someFunc() { for (; ; c++) { switch (foo) { case 1: something(); default: return; } } }
