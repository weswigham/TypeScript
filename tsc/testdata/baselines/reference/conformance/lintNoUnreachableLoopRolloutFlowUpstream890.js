//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream890.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) for (a; b; c);

//// [input.ts]
for (a = 0; b < foo; ) for (a; b; c);
