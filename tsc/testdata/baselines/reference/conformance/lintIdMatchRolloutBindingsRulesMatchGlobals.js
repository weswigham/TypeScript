//// [tests/cases/conformance/lint/rules/id-match/lintIdMatchRolloutBindingsRulesMatchGlobals.ts] ////

//// [input.ts]
const good = Object.keys(source); function task(Object) { Object.keys(source); }

//// [input.ts]
const good = Object.keys(source); function task(Object) { Object.keys(source); }
