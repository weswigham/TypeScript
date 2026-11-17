//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2010.ts] ////

//// [input.ts]
function someFunc() { for (let a in f(b)) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (let a in f(b)) { if (foo) { return; } else { break; } bar(); } }
