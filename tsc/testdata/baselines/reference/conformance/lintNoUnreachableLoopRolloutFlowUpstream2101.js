//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2101.ts] ////

//// [input.ts]
function someFunc() { for ({ a, b } of c) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
function someFunc() { for ({ a, b } of c) { switch (foo) { case 1: something(); default: return; } } }
