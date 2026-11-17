//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1936.ts] ////

//// [input.ts]
for (a in b) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (a in b) { for (; ; c) if (foo) break; break; }
