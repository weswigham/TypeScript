//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1822.ts] ////

//// [input.ts]
for (; b < foo; ) { for (a in b); break; }

//// [input.ts]
for (; b < foo; ) { for (a in b); break; }
