//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1992.ts] ////

//// [input.ts]
for (var a in b) { for (a; b; c); break; }

//// [input.ts]
for (var a in b) { for (a; b; c); break; }
