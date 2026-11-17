//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream851.ts] ////

//// [input.ts]
function someFunc() { for (a; b;) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (a; b;) { switch (foo) { case 1: return; } } }
