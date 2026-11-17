//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1007.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; ) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (; b < foo; ) while (foo) if (bar) return; }
