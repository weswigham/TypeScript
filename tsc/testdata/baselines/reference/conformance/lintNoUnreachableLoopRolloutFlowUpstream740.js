//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream740.ts] ////

//// [input.ts]
function someFunc() { for (; b; c) { switch (foo) { case 1: break; default: return; } } }

//// [input.ts]
function someFunc() { for (; b; c) { switch (foo) { case 1: break; default: return; } } }
