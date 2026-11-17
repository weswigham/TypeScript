//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1349.ts] ////

//// [input.ts]
for (x = 1; x < 10; i++) { if (x > 0) { foo(); throw err; } }

//// [input.ts]
for (x = 1; x < 10; i++) { if (x > 0) { foo(); throw err; } }
