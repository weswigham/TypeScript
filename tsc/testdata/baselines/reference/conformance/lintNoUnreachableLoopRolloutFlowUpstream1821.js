//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1821.ts] ////

//// [input.ts]
for (; b < foo; ) { for(;;) if (foo) break; break; }

//// [input.ts]
for (; b < foo; ) { for(;;) if (foo) break; break; }
