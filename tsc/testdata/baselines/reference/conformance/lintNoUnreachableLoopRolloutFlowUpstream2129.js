//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2129.ts] ////

//// [input.ts]
function someFunc() { for (var a of f(b)) { switch (foo) { case 1: throw err; default: return; } } }

//// [input.ts]
function someFunc() { for (var a of f(b)) { switch (foo) { case 1: throw err; default: return; } } }
