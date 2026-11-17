//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1955.ts] ////

//// [input.ts]
function someFunc() { for (a in f(b)) { switch (foo) { case 1: throw err; default: return; } } }

//// [input.ts]
function someFunc() { for (a in f(b)) { switch (foo) { case 1: throw err; default: return; } } }
