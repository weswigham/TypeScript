//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream796.ts] ////

//// [input.ts]
function someFunc() { for (a; ; c) { switch (foo) { case 1: break; default: return; } } }

//// [input.ts]
function someFunc() { for (a; ; c) { switch (foo) { case 1: break; default: return; } } }
