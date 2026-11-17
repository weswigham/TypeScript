//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2159.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
async function foo() { for await (const a of b) { switch (foo) { case 1: something(); default: return; } } }
