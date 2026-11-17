//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2158.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { switch (foo) { case 1: throw err; default: return; } } }

//// [input.ts]
async function foo() { for await (const a of b) { switch (foo) { case 1: throw err; default: return; } } }
