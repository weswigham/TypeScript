//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2054.ts] ////

//// [input.ts]
for (a of b) { for (a in b); break; }

//// [input.ts]
for (a of b) { for (a in b); break; }
