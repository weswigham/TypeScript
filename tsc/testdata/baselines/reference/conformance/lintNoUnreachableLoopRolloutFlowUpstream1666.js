//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1666.ts] ////

//// [input.ts]
function someFunc() { for (a; b;) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
function someFunc() { for (a; b;) { switch (foo) { case 1: something(); default: return; } } }
