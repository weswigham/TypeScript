//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1994.ts] ////

//// [input.ts]
for (var a in b) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (var a in b) { for (; ; c) if (foo) break; break; }
