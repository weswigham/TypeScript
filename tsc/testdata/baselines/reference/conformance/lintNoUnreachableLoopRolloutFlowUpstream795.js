//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream795.ts] ////

//// [input.ts]
function someFunc() { for (a; ; c) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (a; ; c) { switch (foo) { case 1: return; } } }
