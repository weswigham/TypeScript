//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream979.ts] ////

//// [input.ts]
function someFunc() { for (; b;) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (; b;) while (foo) if (bar) return; }
