//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1259.ts] ////

//// [input.ts]
function someFunc() { for (a of f(b)) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (a of f(b)) while (foo) if (bar) return; }
