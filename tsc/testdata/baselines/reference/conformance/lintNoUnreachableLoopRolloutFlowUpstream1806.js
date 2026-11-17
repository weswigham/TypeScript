//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1806.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; ) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (; b < foo; ) if (foo) break; else return; }
