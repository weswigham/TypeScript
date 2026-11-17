//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream739.ts] ////

//// [input.ts]
function someFunc() { for (; b; c) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (; b; c) { switch (foo) { case 1: return; } } }
