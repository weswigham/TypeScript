//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1674.ts] ////

//// [input.ts]
for (a; b;) { for (; b;); break; }

//// [input.ts]
for (a; b;) { for (; b;); break; }
