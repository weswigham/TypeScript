//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream965.ts] ////

//// [input.ts]
function someFunc() { for (; b;) { switch (foo) { case 1: continue; default: return; } throw err; } }

//// [input.ts]
function someFunc() { for (; b;) { switch (foo) { case 1: continue; default: return; } throw err; } }
