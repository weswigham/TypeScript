//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1868.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ;) { switch (foo) { case 1: throw err; default: return; } } }

//// [input.ts]
function someFunc() { for (a = 0; ;) { switch (foo) { case 1: throw err; default: return; } } }
