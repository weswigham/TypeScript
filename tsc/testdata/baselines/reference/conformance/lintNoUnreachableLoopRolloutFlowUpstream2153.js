//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2153.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { break; foo(); } }

//// [input.ts]
async function foo() { for await (const a of b) { break; foo(); } }
