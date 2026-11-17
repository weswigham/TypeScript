//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1876.ts] ////

//// [input.ts]
for (a = 0; ;) { for (a; b; c); break; }

//// [input.ts]
for (a = 0; ;) { for (a; b; c); break; }
