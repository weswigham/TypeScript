//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1551.ts] ////

//// [input.ts]
function someFunc() { for (; b; c) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (; b; c) { try { return bar(); } catch (e) { break; } } }
