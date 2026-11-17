//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1578.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; c++) { switch (foo) { case 1: throw err; default: return; } } }

//// [input.ts]
function someFunc() { for (; b < foo; c++) { switch (foo) { case 1: throw err; default: return; } } }
