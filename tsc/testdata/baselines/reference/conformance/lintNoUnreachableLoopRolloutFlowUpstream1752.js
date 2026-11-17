//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1752.ts] ////

//// [input.ts]
function someFunc() { for (; ; c++) { switch (foo) { case 1: throw err; default: return; } } }

//// [input.ts]
function someFunc() { for (; ; c++) { switch (foo) { case 1: throw err; default: return; } } }
