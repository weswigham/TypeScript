//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1461.ts] ////

//// [input.ts]
do { switch (foo) { default: throw err; } } while (a && b)

//// [input.ts]
do { switch (foo) { default: throw err; } } while (a && b)
