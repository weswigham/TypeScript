//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1701.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { do ; while (a) break; }

//// [input.ts]
for (a = 0; b < foo; ) { do ; while (a) break; }
