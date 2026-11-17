//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1823.ts] ////

//// [input.ts]
for (; b < foo; ) { for (a of b); break; }

//// [input.ts]
for (; b < foo; ) { for (a of b); break; }
