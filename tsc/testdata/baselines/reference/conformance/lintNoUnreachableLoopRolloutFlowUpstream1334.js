//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1334.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) (() => a)(); }

//// [input.ts]
async function foo() { for await (const a of b) (() => a)(); }
