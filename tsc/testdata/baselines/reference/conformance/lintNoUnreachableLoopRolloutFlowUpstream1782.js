//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1782.ts] ////

//// [input.ts]
function someFunc() { for (; b;) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
function someFunc() { for (; b;) { switch (foo) { case 1: something(); default: return; } } }
