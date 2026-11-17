//// [tests/cases/conformance/lint/rules/id-match/lintIdMatchRolloutBindingsRulesMatchDestructureDefaults.ts] ////

//// [input.ts]
const {bad_name = other_name, bad_key: bad_alias} = source;

//// [input.ts]
const {bad_name = other_name, bad_key: bad_alias} = source;
