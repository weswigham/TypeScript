//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2042.ts] ////

//// [input.ts]
function someFunc() { for (a of b) { switch (foo) { case 1: throw err; default: return; } } }

//// [input.ts]
function someFunc() { for (a of b) { switch (foo) { case 1: throw err; default: return; } } }
