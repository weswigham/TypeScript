//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1491.ts] ////

//// [input.ts]
function someFunc() { for (a; b; c) { switch (foo) { case 1: throw err; default: return; } } }

//// [input.ts]
function someFunc() { for (a; b; c) { switch (foo) { case 1: throw err; default: return; } } }
