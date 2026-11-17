//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream907.ts] ////

//// [input.ts]
function someFunc() { for (; ; c) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (; ; c) { switch (foo) { case 1: return; } } }
