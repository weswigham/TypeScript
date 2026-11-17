//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2067.ts] ////

//// [input.ts]
function someFunc() { for (a of f(b)) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (a of f(b)) if (foo) break; else return; }
