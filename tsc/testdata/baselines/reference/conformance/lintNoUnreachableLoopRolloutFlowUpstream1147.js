//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1147.ts] ////

//// [input.ts]
function someFunc() { for (a in f(b)) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (a in f(b)) while (foo) if (bar) return; }
