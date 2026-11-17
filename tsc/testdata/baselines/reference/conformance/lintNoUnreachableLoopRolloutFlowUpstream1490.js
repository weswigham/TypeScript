//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1490.ts] ////

//// [input.ts]
for (a; b; c) { switch (foo) { default: throw err; } }

//// [input.ts]
for (a; b; c) { switch (foo) { default: throw err; } }
