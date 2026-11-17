//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream643.ts] ////

//// [input.ts]
function someFunc() { do while (foo) if (bar) return; while (a) }

//// [input.ts]
function someFunc() { do while (foo) if (bar) return; while (a) }
