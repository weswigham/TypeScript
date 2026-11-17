//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1907.ts] ////

//// [input.ts]
for (;;) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (;;) { for (; ; c) if (foo) break; break; }
