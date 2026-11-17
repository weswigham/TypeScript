//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2004.ts] ////

//// [input.ts]
function someFunc() { for (let a in f(b)) { return; } }

//// [input.ts]
function someFunc() { for (let a in f(b)) { return; } }
