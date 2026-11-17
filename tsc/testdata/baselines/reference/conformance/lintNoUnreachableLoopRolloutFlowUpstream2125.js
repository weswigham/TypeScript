//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2125.ts] ////

//// [input.ts]
function someFunc() { for (var a of f(b)) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (var a of f(b)) if (foo) break; else return; }
