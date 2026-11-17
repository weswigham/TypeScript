//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream964.ts] ////

//// [input.ts]
function someFunc() { for (; b;) { switch (foo) { case 1: break; default: return; } } }

//// [input.ts]
function someFunc() { for (; b;) { switch (foo) { case 1: break; default: return; } } }
