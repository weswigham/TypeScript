//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2180.ts] ////

//// [input.ts]
lbl: for (a in b) { while(foo) { continue lbl; } }

//// [input.ts]
lbl: for (a in b) { while(foo) { continue lbl; } }
