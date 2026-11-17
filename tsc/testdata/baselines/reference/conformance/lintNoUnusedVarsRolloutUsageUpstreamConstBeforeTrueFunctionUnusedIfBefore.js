//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstBeforeTrueFunctionUnusedIfBefore.ts] ////

//// [globals.d.ts]

//// [input.ts]
const before = true
function unused() {}
if (before) {}

//// [input.ts]
const before = true
function unused() {}
if (before) {}
