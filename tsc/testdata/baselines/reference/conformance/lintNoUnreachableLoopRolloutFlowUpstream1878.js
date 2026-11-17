//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1878.ts] ////

//// [input.ts]
for (a = 0; ;) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (a = 0; ;) { for (; ; c) if (foo) break; break; }
