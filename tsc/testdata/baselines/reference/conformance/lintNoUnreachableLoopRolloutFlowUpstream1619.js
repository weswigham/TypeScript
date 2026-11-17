//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1619.ts] ////

//// [input.ts]
for (a; ; c) { for (a in b); break; }

//// [input.ts]
for (a; ; c) { for (a in b); break; }
