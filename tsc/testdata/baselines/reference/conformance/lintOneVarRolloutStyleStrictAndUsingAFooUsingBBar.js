//// [tests/cases/conformance/lint/rules/one-var/lintOneVarRolloutStyleStrictAndUsingAFooUsingBBar.ts] ////

//// [input.ts]
using a=foo(); using b=bar();

//// [input.ts]
using a=foo(),  b=bar();
