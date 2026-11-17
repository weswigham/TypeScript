//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2182.ts] ////

//// [input.ts]
function foo () { for (a in b) { while (true) { if (bar) { return; } } } }

//// [input.ts]
function foo () { for (a in b) { while (true) { if (bar) { return; } } } }
