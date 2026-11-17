//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1809.ts] ////

//// [input.ts]
for (; b < foo; ) { switch (foo) { default: throw err; } }

//// [input.ts]
for (; b < foo; ) { switch (foo) { default: throw err; } }
