//// [tests/cases/conformance/lint/rules/one-var/lintOneVarRolloutStyleStrictAndAwaitUsingAFooAwaitUsingBBar.ts] ////

//// [input.ts]
await using a=foo(); await using b=bar();

//// [input.ts]
await using a=foo(),   b=bar();
