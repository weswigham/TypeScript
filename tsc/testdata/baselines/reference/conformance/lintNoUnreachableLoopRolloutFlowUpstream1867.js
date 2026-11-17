//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1867.ts] ////

//// [input.ts]
for (a = 0; ;) { switch (foo) { default: throw err; } }

//// [input.ts]
for (a = 0; ;) { switch (foo) { default: throw err; } }
