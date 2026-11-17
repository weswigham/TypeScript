//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1561.ts] ////

//// [input.ts]
for (; b; c) { for (a in b); break; }

//// [input.ts]
for (; b; c) { for (a in b); break; }
