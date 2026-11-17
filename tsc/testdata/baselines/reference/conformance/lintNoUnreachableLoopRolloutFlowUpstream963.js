//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream963.ts] ////

//// [input.ts]
function someFunc() { for (; b;) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (; b;) { switch (foo) { case 1: return; } } }
