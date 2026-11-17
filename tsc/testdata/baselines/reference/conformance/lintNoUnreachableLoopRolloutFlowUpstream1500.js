//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1500.ts] ////

//// [input.ts]
for (a; b; c) { for (; b;); break; }

//// [input.ts]
for (a; b; c) { for (; b;); break; }
