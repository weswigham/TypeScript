//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2038.ts] ////

//// [input.ts]
function someFunc() { for (a of b) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (a of b) if (foo) break; else return; }
