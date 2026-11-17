//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1433.ts] ////

//// [input.ts]
function someFunc() { do { switch (foo) { case 1: throw err; default: return; } } while (a) }

//// [input.ts]
function someFunc() { do { switch (foo) { case 1: throw err; default: return; } } while (a) }
