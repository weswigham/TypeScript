//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream811.ts] ////

//// [input.ts]
function someFunc() { for (a; ; c) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (a; ; c) while (foo) if (bar) return; }
