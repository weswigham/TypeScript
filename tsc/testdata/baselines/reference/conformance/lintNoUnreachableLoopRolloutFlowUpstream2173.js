//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2173.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { for (var i = 0; ; i< 10) { foo(); } } }

//// [input.ts]
async function foo() { for await (const a of b) { for (var i = 0; ; i< 10) { foo(); } } }
