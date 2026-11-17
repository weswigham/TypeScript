//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1996.ts] ////

//// [input.ts]
for (var a in b) { for (a in b); break; }

//// [input.ts]
for (var a in b) { for (a in b); break; }
