//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1337.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) do ; while (a) }

//// [input.ts]
async function foo() { for await (const a of b) do ; while (a) }
