//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream896.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) for (a in b);

//// [input.ts]
for (a = 0; b < foo; ) for (a in b);
