//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1997.ts] ////

//// [input.ts]
for (var a in b) { for (a of b); break; }

//// [input.ts]
for (var a in b) { for (a of b); break; }
