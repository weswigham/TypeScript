//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1702.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { for (a; b; c); break; }

//// [input.ts]
for (a = 0; b < foo; ) { for (a; b; c); break; }
