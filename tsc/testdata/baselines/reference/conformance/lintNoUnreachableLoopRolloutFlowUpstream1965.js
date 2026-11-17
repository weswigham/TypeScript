//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1965.ts] ////

//// [input.ts]
for (a in f(b)) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (a in f(b)) { for (; ; c) if (foo) break; break; }
