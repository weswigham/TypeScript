//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1793.ts] ////

//// [input.ts]
for (; b;) { for (a in b); break; }

//// [input.ts]
for (; b;) { for (a in b); break; }
