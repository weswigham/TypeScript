//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream897.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) for (a of b);

//// [input.ts]
for (a = 0; b < foo; ) for (a of b);
