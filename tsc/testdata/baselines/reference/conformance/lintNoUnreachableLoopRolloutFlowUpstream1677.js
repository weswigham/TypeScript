//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1677.ts] ////

//// [input.ts]
for (a; b;) { for (a in b); break; }

//// [input.ts]
for (a; b;) { for (a in b); break; }
