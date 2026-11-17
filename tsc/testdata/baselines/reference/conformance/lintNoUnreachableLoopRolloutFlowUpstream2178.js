//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2178.ts] ////

//// [input.ts]
function foo() { for (var i = 0; i < 10; i++) { do { return; } while(i) } }

//// [input.ts]
function foo() { for (var i = 0; i < 10; i++) { do { return; } while(i) } }
