//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2009.ts] ////

//// [input.ts]
function someFunc() { for (let a in f(b)) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (let a in f(b)) if (foo) break; else return; }
