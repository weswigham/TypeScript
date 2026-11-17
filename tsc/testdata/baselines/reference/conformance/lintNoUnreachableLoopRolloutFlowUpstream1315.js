//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1315.ts] ////

//// [input.ts]
function someFunc() { for (var a of f(b)) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (var a of f(b)) while (foo) if (bar) return; }
