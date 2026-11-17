//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1819.ts] ////

//// [input.ts]
for (; b < foo; ) { for (; b;); break; }

//// [input.ts]
for (; b < foo; ) { for (; b;); break; }
