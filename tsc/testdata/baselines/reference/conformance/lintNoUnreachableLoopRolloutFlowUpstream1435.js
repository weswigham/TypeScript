//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1435.ts] ////

//// [input.ts]
function someFunc() { do { try { return bar(); } catch (e) { break; } } while (a) }

//// [input.ts]
function someFunc() { do { try { return bar(); } catch (e) { break; } } while (a) }
