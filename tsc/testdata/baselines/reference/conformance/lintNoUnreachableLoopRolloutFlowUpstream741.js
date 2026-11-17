//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream741.ts] ////

//// [input.ts]
function someFunc() { for (; b; c) { switch (foo) { case 1: continue; default: return; } throw err; } }

//// [input.ts]
function someFunc() { for (; b; c) { switch (foo) { case 1: continue; default: return; } throw err; } }
