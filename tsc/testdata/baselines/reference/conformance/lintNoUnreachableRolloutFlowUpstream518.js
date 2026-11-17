//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream518.ts] ////

//// [input.ts]
function foo() { try { a.b.c = 1; return; } catch (err) { return err; } }

//// [input.ts]
function foo() { try { a.b.c = 1; return; } catch (err) { return err; } }
