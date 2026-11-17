//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1935.ts] ////

//// [input.ts]
for (a in b) { for (; b;); break; }

//// [input.ts]
for (a in b) { for (; b;); break; }
