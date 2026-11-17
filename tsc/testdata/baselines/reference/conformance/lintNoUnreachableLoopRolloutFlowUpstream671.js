//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream671.ts] ////

//// [input.ts]
function someFunc() { do while (foo) if (bar) return; while (a && b) }

//// [input.ts]
function someFunc() { do while (foo) if (bar) return; while (a && b) }
