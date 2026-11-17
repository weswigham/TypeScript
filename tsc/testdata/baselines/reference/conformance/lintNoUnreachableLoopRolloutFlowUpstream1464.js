//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1464.ts] ////

//// [input.ts]
function someFunc() { do { try { return bar(); } catch (e) { break; } } while (a && b) }

//// [input.ts]
function someFunc() { do { try { return bar(); } catch (e) { break; } } while (a && b) }
