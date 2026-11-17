//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1695.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { switch (foo) { case 1: something(); default: return; } } }
