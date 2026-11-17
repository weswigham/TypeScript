//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2013.ts] ////

//// [input.ts]
function someFunc() { for (let a in f(b)) { switch (foo) { case 1: throw err; default: return; } } }

//// [input.ts]
function someFunc() { for (let a in f(b)) { switch (foo) { case 1: throw err; default: return; } } }
