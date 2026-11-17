//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2051.ts] ////

//// [input.ts]
for (a of b) { for (; b;); break; }

//// [input.ts]
for (a of b) { for (; b;); break; }
