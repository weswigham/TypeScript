//// [tests/cases/conformance/lint/rules/camelcase/lintCamelcaseRolloutBindingsRulesCamelQuotedExports.ts] ////

//// [input.ts]
export {value as 'snake_case'}; export * as 'other_name' from 'mod';

//// [input.ts]
export {value as 'snake_case'}; export * as 'other_name' from 'mod';
