//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1707.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { for (a of b); break; }

//// [input.ts]
for (a = 0; b < foo; ) { for (a of b); break; }
