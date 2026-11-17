//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream991.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; ) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (; b < foo; ) { switch (foo) { case 1: return; } } }
