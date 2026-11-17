//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1405.ts] ////

//// [input.ts]
function someFunc() { while (a && b) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
function someFunc() { while (a && b) { switch (foo) { case 1: something(); default: return; } } }
