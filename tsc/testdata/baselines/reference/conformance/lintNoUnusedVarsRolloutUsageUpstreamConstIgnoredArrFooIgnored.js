//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstIgnoredArrFooIgnored.ts] ////

//// [globals.d.ts]

//// [input.ts]
const [ignored] = arr;
foo(ignored);

//// [input.ts]
const [ignored] = arr;
foo(ignored);
