//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1558.ts] ////

//// [input.ts]
for (; b; c) { for (; b;); break; }

//// [input.ts]
for (; b; c) { for (; b;); break; }
