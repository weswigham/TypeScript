//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1272.ts] ////

//// [input.ts]
function someFunc() { for ({ a, b } of c) { switch (foo) { case 1: break; default: return; } } }

//// [input.ts]
function someFunc() { for ({ a, b } of c) { switch (foo) { case 1: break; default: return; } } }
