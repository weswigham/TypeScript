//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream872.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { bar(); }

//// [input.ts]
for (a = 0; b < foo; ) { bar(); }
