//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2071.ts] ////

//// [input.ts]
function someFunc() { for (a of f(b)) { switch (foo) { case 1: throw err; default: return; } } }

//// [input.ts]
function someFunc() { for (a of f(b)) { switch (foo) { case 1: throw err; default: return; } } }
