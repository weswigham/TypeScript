//// [tests/cases/conformance/lint/rules/one-var/lintOneVarRolloutStyleStrictAndAwaitUsingAFooBBar.ts] ////

//// [input.ts]
await using a=foo(), b=bar();

//// [input.ts]
await using a=foo(); await using b=bar();
