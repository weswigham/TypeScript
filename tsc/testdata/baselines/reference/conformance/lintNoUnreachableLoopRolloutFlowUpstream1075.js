//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1075.ts] ////

//// [input.ts]
function someFunc() { for (;;) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (;;) { switch (foo) { case 1: return; } } }
