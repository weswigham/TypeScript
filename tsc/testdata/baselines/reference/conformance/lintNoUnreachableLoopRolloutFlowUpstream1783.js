//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1783.ts] ////

//// [input.ts]
function someFunc() { for (; b;) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (; b;) { try { return bar(); } catch (e) { break; } } }
