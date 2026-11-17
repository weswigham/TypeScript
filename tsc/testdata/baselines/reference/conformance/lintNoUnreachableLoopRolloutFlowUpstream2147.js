//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2147.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { break; } }

//// [input.ts]
async function foo() { for await (const a of b) { break; } }
