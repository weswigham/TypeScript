//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1804.ts] ////

//// [input.ts]
for (; b < foo; ) { foo(); break; }

//// [input.ts]
for (; b < foo; ) { foo(); break; }
