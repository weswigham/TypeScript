//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1849.ts] ////

//// [input.ts]
for (a; ;) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (a; ;) { for (; ; c) if (foo) break; break; }
