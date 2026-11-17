//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1694.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { switch (foo) { case 1: throw err; default: return; } } }

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { switch (foo) { case 1: throw err; default: return; } } }
