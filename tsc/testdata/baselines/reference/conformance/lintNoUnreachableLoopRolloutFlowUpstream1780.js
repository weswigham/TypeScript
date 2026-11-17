//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1780.ts] ////

//// [input.ts]
for (; b;) { switch (foo) { default: throw err; } }

//// [input.ts]
for (; b;) { switch (foo) { default: throw err; } }
