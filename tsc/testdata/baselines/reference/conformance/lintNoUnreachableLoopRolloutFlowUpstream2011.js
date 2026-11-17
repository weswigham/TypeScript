//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2011.ts] ////

//// [input.ts]
function someFunc() { for (let a in f(b)) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (let a in f(b)) { if (foo) { return; } throw err; } }
