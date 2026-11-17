//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1898.ts] ////

//// [input.ts]
function someFunc() { for (;;) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
function someFunc() { for (;;) { switch (foo) { case 1: something(); default: return; } } }
