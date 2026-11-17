//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1493.ts] ////

//// [input.ts]
function someFunc() { for (a; b; c) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (a; b; c) { try { return bar(); } catch (e) { break; } } }
