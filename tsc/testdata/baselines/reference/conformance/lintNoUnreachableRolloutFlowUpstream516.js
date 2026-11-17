//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream516.ts] ////

//// [input.ts]
function* foo() { try { yield 1; return; } catch (err) { return err; } }

//// [input.ts]
function* foo() { try { yield 1; return; } catch (err) { return err; } }
