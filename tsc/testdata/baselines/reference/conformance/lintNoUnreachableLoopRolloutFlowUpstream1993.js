//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1993.ts] ////

//// [input.ts]
for (var a in b) { for (; b;); break; }

//// [input.ts]
for (var a in b) { for (; b;); break; }
