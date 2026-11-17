//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1881.ts] ////

//// [input.ts]
for (a = 0; ;) { for (a of b); break; }

//// [input.ts]
for (a = 0; ;) { for (a of b); break; }
