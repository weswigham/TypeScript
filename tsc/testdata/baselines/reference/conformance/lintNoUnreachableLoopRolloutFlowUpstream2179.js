//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2179.ts] ////

//// [input.ts]
lbl: while(foo) { do { break lbl; } while(baz) }

//// [input.ts]
lbl: while(foo) { do { break lbl; } while(baz) }
