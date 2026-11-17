//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1706.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { for (a in b); break; }

//// [input.ts]
for (a = 0; b < foo; ) { for (a in b); break; }
