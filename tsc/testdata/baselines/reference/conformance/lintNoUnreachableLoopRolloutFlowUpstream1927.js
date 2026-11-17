//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1927.ts] ////

//// [input.ts]
function someFunc() { for (a in b) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
function someFunc() { for (a in b) { switch (foo) { case 1: something(); default: return; } } }
