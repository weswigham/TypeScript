//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1345.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) for (a of b); }

//// [input.ts]
async function foo() { for await (const a of b) for (a of b); }
