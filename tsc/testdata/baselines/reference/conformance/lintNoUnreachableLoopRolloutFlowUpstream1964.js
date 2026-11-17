//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1964.ts] ////

//// [input.ts]
for (a in f(b)) { for (; b;); break; }

//// [input.ts]
for (a in f(b)) { for (; b;); break; }
