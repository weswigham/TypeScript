//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2184.ts] ////

//// [input.ts]
do { for (var i = 1; i < 10; i++) continue; break; } while(foo)

//// [input.ts]
do { for (var i = 1; i < 10; i++) continue; break; } while(foo)
