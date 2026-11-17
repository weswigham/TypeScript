//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1791.ts] ////

//// [input.ts]
for (; b;) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (; b;) { for (; ; c) if (foo) break; break; }
