//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1076.ts] ////

//// [input.ts]
function someFunc() { for (;;) { switch (foo) { case 1: break; default: return; } } }

//// [input.ts]
function someFunc() { for (;;) { switch (foo) { case 1: break; default: return; } } }
