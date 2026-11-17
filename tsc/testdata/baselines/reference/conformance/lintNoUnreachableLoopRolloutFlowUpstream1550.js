//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1550.ts] ////

//// [input.ts]
function someFunc() { for (; b; c) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
function someFunc() { for (; b; c) { switch (foo) { case 1: something(); default: return; } } }
