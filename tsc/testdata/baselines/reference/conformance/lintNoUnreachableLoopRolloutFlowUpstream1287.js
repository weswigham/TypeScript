//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1287.ts] ////

//// [input.ts]
function someFunc() { for ({ a, b } of c) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for ({ a, b } of c) while (foo) if (bar) return; }
