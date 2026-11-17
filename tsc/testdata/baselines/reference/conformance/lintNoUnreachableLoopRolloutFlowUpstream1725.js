//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1725.ts] ////

//// [input.ts]
function someFunc() { for (; ; c) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (; ; c) { try { return bar(); } catch (e) { break; } } }
