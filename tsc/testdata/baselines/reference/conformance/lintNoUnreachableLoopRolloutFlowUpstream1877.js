//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1877.ts] ////

//// [input.ts]
for (a = 0; ;) { for (; b;); break; }

//// [input.ts]
for (a = 0; ;) { for (; b;); break; }
