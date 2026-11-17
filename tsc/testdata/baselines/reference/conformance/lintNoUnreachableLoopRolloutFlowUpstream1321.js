//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1321.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) continue; }

//// [input.ts]
async function foo() { for await (const a of b) continue; }
