//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1385.ts] ////

//// [input.ts]
while (a) { for (; ; c) if (foo) break; break; }

//// [input.ts]
while (a) { for (; ; c) if (foo) break; break; }
