//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1688.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { foo(); break; }

//// [input.ts]
for (a = 0; b < foo; ) { foo(); break; }
