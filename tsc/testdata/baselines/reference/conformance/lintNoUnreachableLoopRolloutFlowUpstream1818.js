//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1818.ts] ////

//// [input.ts]
for (; b < foo; ) { for (a; b; c); break; }

//// [input.ts]
for (; b < foo; ) { for (a; b; c); break; }
