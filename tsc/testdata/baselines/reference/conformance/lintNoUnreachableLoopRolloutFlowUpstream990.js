//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream990.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; ) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (; b < foo; ) { if (foo) { continue; } return; } }
