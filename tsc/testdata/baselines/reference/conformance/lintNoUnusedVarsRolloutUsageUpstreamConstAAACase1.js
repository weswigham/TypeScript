//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstAAACase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
const a = () => () => { a(); }; a();

//// [input.ts]
const a = () => () => { a(); }; a();
