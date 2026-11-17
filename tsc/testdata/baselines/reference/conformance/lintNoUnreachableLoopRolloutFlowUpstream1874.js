//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1874.ts] ////

//// [input.ts]
for (a = 0; ;) { while (a); break; }

//// [input.ts]
for (a = 0; ;) { while (a); break; }
