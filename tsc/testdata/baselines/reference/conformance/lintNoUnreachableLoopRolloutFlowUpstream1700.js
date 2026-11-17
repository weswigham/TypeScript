//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1700.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { while (a); break; }

//// [input.ts]
for (a = 0; b < foo; ) { while (a); break; }
