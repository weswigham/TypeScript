//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1839.ts] ////

//// [input.ts]
function someFunc() { for (a; ;) { switch (foo) { case 1: throw err; default: return; } } }

//// [input.ts]
function someFunc() { for (a; ;) { switch (foo) { case 1: throw err; default: return; } } }
