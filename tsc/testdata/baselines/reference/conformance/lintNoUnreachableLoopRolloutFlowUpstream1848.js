//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1848.ts] ////

//// [input.ts]
for (a; ;) { for (; b;); break; }

//// [input.ts]
for (a; ;) { for (; b;); break; }
