//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2099.ts] ////

//// [input.ts]
for ({ a, b } of c) { switch (foo) { default: throw err; } }

//// [input.ts]
for ({ a, b } of c) { switch (foo) { default: throw err; } }
