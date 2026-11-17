//// [tests/cases/conformance/lint/rules/id-match/lintIdMatchRolloutBindingsRulesMatchDestructureIgnored.ts] ////

//// [input.ts]
const {bad_name = other_name, bad_key: bad_alias, ...rest_name} = source;

//// [input.ts]
const {bad_name = other_name, bad_key: bad_alias, ...rest_name} = source;
