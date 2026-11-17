//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2160.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
async function foo() { for await (const a of b) { try { return bar(); } catch (e) { break; } } }
