//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2156.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { if (foo) { return; } throw err; } }

//// [input.ts]
async function foo() { for await (const a of b) { if (foo) { return; } throw err; } }
