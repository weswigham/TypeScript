//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2181.ts] ////

//// [input.ts]
for (a of b) { for(;;) { if (foo) { throw err; } } }

//// [input.ts]
for (a of b) { for(;;) { if (foo) { throw err; } } }
