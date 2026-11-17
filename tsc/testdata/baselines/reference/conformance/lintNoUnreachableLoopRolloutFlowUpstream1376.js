//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1376.ts] ////

//// [input.ts]
function someFunc() { while (a) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
function someFunc() { while (a) { switch (foo) { case 1: something(); default: return; } } }
