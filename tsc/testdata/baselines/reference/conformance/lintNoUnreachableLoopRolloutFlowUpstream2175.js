//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2175.ts] ////

//// [input.ts]
while (foo) { for (a of b) { if (baz) { break; } else { throw err; } } }

//// [input.ts]
while (foo) { for (a of b) { if (baz) { break; } else { throw err; } } }
