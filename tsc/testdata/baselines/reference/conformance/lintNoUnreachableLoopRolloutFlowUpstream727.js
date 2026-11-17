//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream727.ts] ////

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) while (foo) if (bar) return; }
