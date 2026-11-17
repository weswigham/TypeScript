//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1410.ts] ////

//// [input.ts]
while (a && b) { while (a); break; }

//// [input.ts]
while (a && b) { while (a); break; }
