//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1703.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { for (; b;); break; }

//// [input.ts]
for (a = 0; b < foo; ) { for (; b;); break; }
