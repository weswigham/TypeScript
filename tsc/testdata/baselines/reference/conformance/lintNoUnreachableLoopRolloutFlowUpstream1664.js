//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1664.ts] ////

//// [input.ts]
for (a; b;) { switch (foo) { default: throw err; } }

//// [input.ts]
for (a; b;) { switch (foo) { default: throw err; } }
