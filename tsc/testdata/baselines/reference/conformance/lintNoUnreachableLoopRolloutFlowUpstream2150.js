//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2150.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) throw err; }

//// [input.ts]
async function foo() { for await (const a of b) throw err; }
