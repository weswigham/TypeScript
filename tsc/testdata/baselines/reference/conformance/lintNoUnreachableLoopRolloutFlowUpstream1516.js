//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1516.ts] ////

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) if (foo) break; else return; }
