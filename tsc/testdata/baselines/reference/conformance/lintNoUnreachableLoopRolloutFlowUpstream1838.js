//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1838.ts] ////

//// [input.ts]
for (a; ;) { switch (foo) { default: throw err; } }

//// [input.ts]
for (a; ;) { switch (foo) { default: throw err; } }
