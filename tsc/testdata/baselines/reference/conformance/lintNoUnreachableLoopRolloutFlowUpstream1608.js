//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1608.ts] ////

//// [input.ts]
function someFunc() { for (a; ; c) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
function someFunc() { for (a; ; c) { switch (foo) { case 1: something(); default: return; } } }
