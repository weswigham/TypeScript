//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1684.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) return; }

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) return; }
