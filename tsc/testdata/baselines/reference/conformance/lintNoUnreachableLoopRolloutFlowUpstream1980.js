//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1980.ts] ////

//// [input.ts]
function someFunc() { for (var a in b) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (var a in b) if (foo) break; else return; }
