//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1708.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) for (;;);

//// [input.ts]
for (a = 0; b < foo; ) for (;;);
