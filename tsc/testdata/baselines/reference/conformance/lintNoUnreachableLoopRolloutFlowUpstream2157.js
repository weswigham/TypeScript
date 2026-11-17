//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2157.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { switch (foo) { default: throw err; } } }

//// [input.ts]
async function foo() { for await (const a of b) { switch (foo) { default: throw err; } } }
